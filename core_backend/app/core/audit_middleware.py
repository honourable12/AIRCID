# app/core/audit_middleware.py
from typing import Optional
from sqlalchemy import event, func
from sqlalchemy.orm.session import Session
from sqlalchemy.orm import attributes
from app.models.audit import AuditLog # Import the AuditLog ORM model
from app.core.database import Base
import json
import inspect # To check if an object is an ORM instance

# Global variables to hold context for the current request
# These are used to pass user_id and IP from middleware/dependency to event listeners
_current_user_id = None
_current_request_ip = None

def set_audit_context(user_id: Optional[int], request_ip: Optional[str] = None):
    """Sets the user ID and IP address for the current request's audit logs."""
    global _current_user_id, _current_request_ip
    _current_user_id = user_id
    _current_request_ip = request_ip

def clear_audit_context():
    """Clears the audit context after a request is processed."""
    global _current_user_id, _current_request_ip
    _current_user_id = None
    _current_request_ip = None

def get_current_user_id() -> Optional[int]:
    """Retrieves the user ID from the current audit context."""
    return _current_user_id

def get_current_request_ip() -> Optional[str]:
    """Retrieves the IP address from the current audit context."""
    return _current_request_ip

def record_audit_log(
    session: Session,
    instance: Base,
    action: str,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None
):
    """
    Helper function to create and add an AuditLog entry to the session.
    It adds the log to the same session, so it will be committed with the main transaction.
    """
    # Ensure old_values and new_values are JSON serializable
    # SQLAlchemy's JSON type handles dicts, but ensure no complex objects remain
    
    audit_log = AuditLog(
        user_id=get_current_user_id(),
        action=action,
        table_name=instance.__tablename__,
        record_id=getattr(instance, 'id', None), # Get ID if available (e.g., for updates/deletes)
        old_values=old_values,
        new_values=new_values,
        timestamp=func.now(), # Use server's time for consistency
        ip_address=get_current_request_ip()
    )
    session.add(audit_log)

def setup_audit_listeners():
    """
    Sets up SQLAlchemy event listeners to automatically generate audit logs
    for 'CREATE', 'UPDATE', and 'DELETE' operations on ORM models.
    """

    @event.listens_for(Session, 'before_flush')
    def receive_before_flush(session, flush_context, instances):
        """
        Captures changes before they are committed to the database.
        Handles 'CREATE' and 'UPDATE' operations.
        """
        # Handle insertions (new objects)
        for instance in session.new:
            # Check if it's an ORM-mapped instance and not an AuditLog itself
            if inspect.is_mapper(instance.__mapper__) and not isinstance(instance, AuditLog):
                new_values = {}
                for col in instance.__table__.columns:
                    # Capture all column values for new records
                    new_values[col.name] = getattr(instance, col.name, None)
                record_audit_log(session, instance, 'CREATE', new_values=new_values)

        # Handle updates (dirty objects)
        for instance in session.dirty:
            if inspect.is_mapper(instance.__mapper__) and not isinstance(instance, AuditLog):
                old_values = {}
                new_values = {}
                # Get the history of changes for each attribute
                for attr_key, history in attributes.get_history(instance, passive=True).items():
                    # Check if the attribute has changes
                    if history.has_changes():
                        # original contains the value before the change
                        # added contains the new value
                        old_values[attr_key] = history.original[0] if history.original else None
                        new_values[attr_key] = history.added[0] if history.added else None
                
                # Only log if there were actual changes to tracked attributes
                if old_values or new_values: # Check if any changes were recorded
                    record_audit_log(session, instance, 'UPDATE', old_values=old_values, new_values=new_values)

    @event.listens_for(Session, 'after_delete')
    def receive_after_delete(session, flush_context):
        """
        Captures objects marked for deletion after they've been processed by the flush.
        This event fires after the DELETE SQL is issued, but before the transaction commits.
        """
        for instance in session.deleted:
            if inspect.is_mapper(instance.__mapper__) and not isinstance(instance, AuditLog):
                # Capture current state of the object before it's gone from the DB
                old_values = {}
                for col in instance.__table__.columns:
                    old_values[col.name] = getattr(instance, col.name, None)
                record_audit_log(session, instance, 'DELETE', old_values=old_values)

