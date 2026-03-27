"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
}

interface PatientContextValue {
  patients: PatientInfo[];
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string) => void;
  isFamilyPlan: boolean;
  loading: boolean;
  /** Append ?patientId=xxx to a URL if family plan */
  patientQuery: string;
  refresh: () => void;
}

const PatientCtx = createContext<PatientContextValue>({
  patients: [],
  selectedPatientId: null,
  setSelectedPatientId: () => {},
  isFamilyPlan: false,
  loading: true,
  patientQuery: "",
  refresh: () => {},
});

export function usePatientContext() {
  return useContext(PatientCtx);
}

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((data) => {
        const pts = data.patients || [];
        setPatients(pts);
        setPlan(data.plan || null);
        if (pts.length > 0 && !selectedPatientId) {
          setSelectedPatientId(pts[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const familyPlan = !!plan && plan.includes("_FAMILY");
  const patientQuery = familyPlan && selectedPatientId ? `patientId=${selectedPatientId}` : "";

  return (
    <PatientCtx.Provider value={{
      patients,
      selectedPatientId,
      setSelectedPatientId,
      isFamilyPlan: familyPlan,
      loading,
      patientQuery,
      refresh: load,
    }}>
      {children}
    </PatientCtx.Provider>
  );
}
