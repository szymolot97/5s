import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Area,
  Audit,
  AuditItem,
  AuditScores,
  NonConformance,
  Task,
  Department,
  Zone,
  DEFAULT_AREAS,
  DEFAULT_CHECKLIST_ITEMS,
  DEFAULT_DEPARTMENTS,
  Pillar,
} from './types';

const STORAGE_KEY = 'audit_app_data_v2';

type AppState = {
  areas: Area[];
  departments: Department[];
  audits: Audit[];
  tasks: Task[];
  currentAudit: Audit | null;
};

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_AREA'; payload: Area }
  | { type: 'UPDATE_AREA'; payload: Area }
  | { type: 'DELETE_AREA'; payload: string }
  | { type: 'START_AUDIT'; payload: Audit }
  | { type: 'UPDATE_AUDIT_ITEM'; payload: { auditId: string; item: AuditItem } }
  | { type: 'ADD_NON_CONFORMANCE'; payload: { auditId: string; nc: NonConformance } }
  | { type: 'COMPLETE_AUDIT'; payload: { auditId: string; scores: AuditScores } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'SET_CURRENT_AUDIT'; payload: Audit | null };

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function calculateScores(items: AuditItem[]): AuditScores {
  const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
  const scores: Record<string, number> = {};

  for (const pillar of pillars) {
    const pillarItems = items.filter((i) => i.pillar === pillar);
    if (pillarItems.length === 0) {
      scores[pillar] = 0;
      continue;
    }
    const total = pillarItems.reduce((sum, item) => {
      if (item.status === 'pass') return sum + 2;
      if (item.status === 'partial') return sum + 1;
      return sum;
    }, 0);
    scores[pillar] = Math.round((total / (pillarItems.length * 2)) * 100);
  }

  const avg = pillars.reduce((sum, p) => sum + scores[p], 0) / pillars.length;
  return {
    '1S': scores['1S'],
    '2S': scores['2S'],
    '3S': scores['3S'],
    '4S': scores['4S'],
    '5S': scores['5S'],
    total: Math.round(avg),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'ADD_AREA':
      return { ...state, areas: [...state.areas, action.payload] };

    case 'UPDATE_AREA':
      return {
        ...state,
        areas: state.areas.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };

    case 'DELETE_AREA':
      return { ...state, areas: state.areas.filter((a) => a.id !== action.payload) };

    case 'START_AUDIT':
      return {
        ...state,
        currentAudit: action.payload,
        audits: [...state.audits, action.payload],
      };

    case 'UPDATE_AUDIT_ITEM': {
      const updateItems = (audit: Audit): Audit => ({
        ...audit,
        items: audit.items.map((i) =>
          i.id === action.payload.item.id ? action.payload.item : i
        ),
      });
      return {
        ...state,
        currentAudit:
          state.currentAudit?.id === action.payload.auditId
            ? updateItems(state.currentAudit)
            : state.currentAudit,
        audits: state.audits.map((a) =>
          a.id === action.payload.auditId ? updateItems(a) : a
        ),
      };
    }

    case 'ADD_NON_CONFORMANCE': {
      const addNC = (audit: Audit): Audit => ({
        ...audit,
        nonConformances: [...audit.nonConformances, action.payload.nc],
      });
      return {
        ...state,
        currentAudit:
          state.currentAudit?.id === action.payload.auditId
            ? addNC(state.currentAudit)
            : state.currentAudit,
        audits: state.audits.map((a) =>
          a.id === action.payload.auditId ? addNC(a) : a
        ),
      };
    }

    case 'COMPLETE_AUDIT': {
      const completeAudit = (audit: Audit): Audit => ({
        ...audit,
        status: 'completed',
        completedAt: new Date().toISOString(),
        scores: action.payload.scores,
      });
      return {
        ...state,
        currentAudit: null,
        audits: state.audits.map((a) =>
          a.id === action.payload.auditId ? completeAudit(a) : a
        ),
      };
    }

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };

    case 'SET_CURRENT_AUDIT':
      return { ...state, currentAudit: action.payload };

    default:
      return state;
  }
}

const initialState: AppState = {
  areas: [],
  departments: [],
  audits: [],
  tasks: [],
  currentAudit: null,
};

type AppContextType = {
  state: AppState;
  addArea: (name: string, description?: string) => void;
  updateArea: (area: Area) => void;
  deleteArea: (id: string) => void;
  startAudit: (departmentId: string, departmentName: string, zoneId: string, zoneName: string) => Audit;
  updateAuditItem: (auditId: string, item: AuditItem) => void;
  addNonConformance: (auditId: string, nc: Omit<NonConformance, 'id' | 'createdAt'>) => NonConformance;
  completeAudit: (auditId: string) => AuditScores;
  updateTask: (task: Task) => void;
  generateId: () => string;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as AppState;
          dispatch({ type: 'LOAD_STATE', payload: { ...saved, currentAudit: null } });
        } else {
          // Seed default departments and areas
          const now = new Date().toISOString();
          const areas: Area[] = DEFAULT_AREAS.map((a) => ({
            ...a,
            id: generateId(),
            createdAt: now,
          }));
          const seeded: AppState = { 
            ...initialState, 
            areas,
            departments: DEFAULT_DEPARTMENTS,
          };
          dispatch({ type: 'LOAD_STATE', payload: seeded });
        }
      } catch (e) {
        console.error('Failed to load state', e);
      }
    })();
  }, []);

  // Persist state on every change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(console.error);
  }, [state]);

  const addArea = useCallback((name: string, description?: string) => {
    const area: Area = { id: generateId(), name, description, createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_AREA', payload: area });
  }, []);

  const updateArea = useCallback((area: Area) => {
    dispatch({ type: 'UPDATE_AREA', payload: area });
  }, []);

  const deleteArea = useCallback((id: string) => {
    dispatch({ type: 'DELETE_AREA', payload: id });
  }, []);

  const startAudit = useCallback(
    (departmentId: string, departmentName: string, zoneId: string, zoneName: string): Audit => {
      const items: AuditItem[] = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
        ...item,
        id: generateId(),
        status: 'pending',
      }));
      const audit: Audit = {
        id: generateId(),
        departmentId,
        departmentName,
        zoneId,
        zoneName,
        startedAt: new Date().toISOString(),
        status: 'in_progress',
        items,
        nonConformances: [],
        scores: { '1S': 0, '2S': 0, '3S': 0, '4S': 0, '5S': 0, total: 0 },
      };
      dispatch({ type: 'START_AUDIT', payload: audit });
      return audit;
    },
    []
  );

  const updateAuditItem = useCallback((auditId: string, item: AuditItem) => {
    dispatch({ type: 'UPDATE_AUDIT_ITEM', payload: { auditId, item } });
  }, []);

  const addNonConformance = useCallback(
    (auditId: string, nc: Omit<NonConformance, 'id' | 'createdAt'>): NonConformance => {
      const full: NonConformance = {
        ...nc,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_NON_CONFORMANCE', payload: { auditId, nc: full } });

      // Mark the audit item as having a non-conformance
      const auditForItem = state.audits.find((a) => a.id === auditId);
      const auditItem = auditForItem?.items.find((i) => i.id === nc.auditItemId);
      if (auditItem) {
        dispatch({ type: 'UPDATE_AUDIT_ITEM', payload: { auditId, item: { ...auditItem, nonConformanceId: full.id } } });
      }

      // Auto-create a task
      const auditRecord = state.audits.find((a) => a.id === auditId);
      const task: Task = {
        id: generateId(),
        nonConformanceId: full.id,
        auditId,
        departmentId: auditRecord?.departmentId || '',
        departmentName: auditRecord?.departmentName || '',
        zoneId: auditRecord?.zoneId || '',
        zoneName: auditRecord?.zoneName || '',
        pillar: nc.pillar,
        title: nc.description.slice(0, 60),
        description: nc.description,
        photos: nc.photos,
        severity: nc.severity,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_TASK', payload: task });

      return full;
    },
    [state.audits]
  );

  const completeAudit = useCallback(
    (auditId: string): AuditScores => {
      const audit = state.audits.find((a) => a.id === auditId);
      if (!audit) return { '1S': 0, '2S': 0, '3S': 0, '4S': 0, '5S': 0, total: 0 };
      const scores = calculateScores(audit.items);
      dispatch({ type: 'COMPLETE_AUDIT', payload: { auditId, scores } });

      // Update tasks with department and zone info
      state.tasks
        .filter((t) => t.auditId === auditId)
        .forEach((t) => {
          dispatch({
            type: 'UPDATE_TASK',
            payload: {
              ...t,
              departmentId: audit.departmentId,
              departmentName: audit.departmentName,
              zoneId: audit.zoneId,
              zoneName: audit.zoneName,
            },
          });
        });

      return scores;
    },
    [state.audits, state.tasks]
  );

  const updateTask = useCallback((task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, updatedAt: new Date().toISOString() } });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        addArea,
        updateArea,
        deleteArea,
        startAudit,
        updateAuditItem,
        addNonConformance,
        completeAudit,
        updateTask,
        generateId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { calculateScores };
