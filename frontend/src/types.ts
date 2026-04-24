export interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  blood_group: string;
  emergency_contact: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface MedicalRecord {
  id: string;
  record_type: string;
  title: string;
  content: string;
  severity: number;
  recorded_at: string;
}

export interface Briefing {
  patient_name: string;
  department_name: string;
  age: number;
  blood_group: string;
  emergency_contact: string;
  briefing_text: string;
  raw_records: MedicalRecord[];
}

export interface Consultation {
  id: string;
  doctor_name: string;
  messages: { role: string; content: string }[];
  created_at: string;
}
