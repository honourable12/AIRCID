# app/seed.py or app/initial_data/seed.py
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_async_session, Base, engine
from app.models.role import Role
from app.models.user import User
from app.core.security import get_password_hash # Assuming this utility exists

async def init_db():
    """
    Initializes the database by creating all tables.
    This should typically be run only once or during migrations.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created (if they didn't exist).")

async def seed_data():
    """
    Seeds initial data into the database.
    This function is idempotent: it will only create data if it doesn't already exist.
    """
    async for session in get_async_session():
        try:
            # Seed Roles
            roles_to_seed = ["administrator", "researcher", "participant"]
            for role_name in roles_to_seed:
                result = await session.execute(select(Role).where(Role.name == role_name))
                role = result.scalars().first()
                if not role:
                    new_role = Role(name=role_name)
                    session.add(new_role)
                    print(f"Role '{role_name}' added.")
                else:
                    print(f"Role '{role_name}' already exists.")
            await session.commit()

            # Seed Default Administrator User
            admin_email = "admin@example.com"
            admin_username = "admin"
            admin_password = "securepassword" # CHANGE THIS IN PRODUCTION!

            result = await session.execute(select(User).where(User.email == admin_email))
            admin_user = result.scalars().first()

            if not admin_user:
                # Get the administrator role ID
                admin_role_result = await session.execute(select(Role).where(Role.name == "administrator"))
                admin_role = admin_role_result.scalars().first()

                if admin_role:
                    hashed_password = get_password_hash(admin_password)
                    new_admin_user = User(
                        email=admin_email,
                        username=admin_username,
                        hashed_password=hashed_password,
                        role_id=admin_role.id,
                        is_active=True
                    )
                    session.add(new_admin_user)
                    await session.commit()
                    print(f"Default administrator user '{admin_username}' added with email '{admin_email}'.")
                else:
                    print("Administrator role not found. Cannot create admin user.")
            else:
                print(f"Administrator user '{admin_email}' already exists.")

        except Exception as e:
            await session.rollback()
            print(f"Error seeding data: {e}")
        finally:
            await session.close()

async def main():
    """
    Main function to run database initialization and seeding.
    """
    await init_db() # Ensure tables exist
    await seed_data() # Seed initial data

if __name__ == "__main__":
    print("Starting database seeding...")
    asyncio.run(main())
    print("Database seeding complete.")