export interface User {
  username: string;
  name: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  sources?: string[];
}

export interface Study {
  id: string;
  title: string;
  objective: string;
  status: 'active' | 'completed' | 'draft';
  created_date: string;
  enrollment_target: number;
  enrollment_current: number;
  last_updated: string;
}

export interface FormSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  title?: string;
}

export interface GenAIResponse {
  answer?: string;
  sources?: string[];
  clearer_wording?: string;
  suggested_rules?: string[];
  json_schema?: FormSchema;
  summary?: string;
  raw_output?: string;
  retrieved_chunks?: string[];
  llm_raw_output?: string;
  history_summarized?: boolean;
}

export interface CriteriaAugmentation {
  clearer_wording: string;
  suggested_rules: any[];
  version_id?: number;
  version_number?: number;
  original_input_hash?: string;
  llm_model_used?: string;
  version_timestamp?: string;
  modified_by?: string;
  refinement_of_version_id?: number;
}

export interface DocumentInfo {
  id: number;
  filename: string;
  file_type: string;
  uploaded_at: string;
  content?: string;
}

export interface FormGenerationResponse {
  json_schema: FormSchema;
  version_id: number;
  version_number: number;
  original_input_hash: string;
  llm_model_used: string;
  version_timestamp: string;
  modified_by: string;
  refinement_of_version_id?: number;
}