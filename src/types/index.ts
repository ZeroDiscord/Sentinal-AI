export type Incident = {
  id: string;
  title: string;
  type: string;
  severity: "Critical" | "High" | "Moderate" | "Low";
  reportedBy: string;
  reporterRole: string;
  date: string;
  status: "Pending" | "In Progress" | "Resolved";
  description: string;
  location: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "CPO" | "School Proctor" | "Warden";
  avatar: string;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  read: boolean;
};

export type AIAnalysisResult = {
  summary: string;
  tags: string[];
  severity: "low" | "moderate" | "high";
  escalate: boolean;
};
