export type Pillar = '1S' | '2S' | '3S' | '4S' | '5S';

export const PILLAR_LABELS: Record<Pillar, { short: string; name: string; color: string }> = {
  '1S': { short: '1S', name: 'Sortowanie (Seiri)', color: '#EF4444' },
  '2S': { short: '2S', name: 'Systematyka (Seiton)', color: '#F59E0B' },
  '3S': { short: '3S', name: 'Sprzątanie (Seiso)', color: '#3B82F6' },
  '4S': { short: '4S', name: 'Standaryzacja (Seiketsu)', color: '#8B5CF6' },
  '5S': { short: '5S', name: 'Samodyscyplina (Shitsuke)', color: '#10B981' },
};

// Hierarchical structure: Department > Zone
export type Zone = {
  id: string;
  name: string;
  description?: string;
};

export type Department = {
  id: string;
  name: string;
  zones: Zone[];
  createdAt: string;
};

// Legacy Area type (kept for backward compatibility in some contexts)
export type Area = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

export type ItemStatus = 'pending' | 'pass' | 'partial' | 'fail';

export type AuditItem = {
  id: string;
  pillar: Pillar;
  description: string;
  status: ItemStatus;
  nonConformanceId?: string;
};

export type NonConformance = {
  id: string;
  auditId: string;
  auditItemId: string;
  pillar: Pillar;
  description: string;
  photos: string[];
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
};

export type Task = {
  id: string;
  nonConformanceId: string;
  auditId: string;
  departmentId: string;
  departmentName: string;
  zoneId: string;
  zoneName: string;
  pillar: Pillar;
  title: string;
  description: string;
  photos: string[];
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'done';
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditScores = {
  '1S': number;
  '2S': number;
  '3S': number;
  '4S': number;
  '5S': number;
  total: number;
};

export type Audit = {
  id: string;
  departmentId: string;
  departmentName: string;
  zoneId: string;
  zoneName: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  items: AuditItem[];
  nonConformances: NonConformance[];
  scores: AuditScores;
};

// Domyślna lista kontrolna 5S
export const DEFAULT_CHECKLIST_ITEMS: Omit<AuditItem, 'id' | 'status' | 'nonConformanceId'>[] = [
  // 1S - Sortowanie
  { pillar: '1S', description: 'Zbędne przedmioty zostały usunięte z miejsca pracy' },
  { pillar: '1S', description: 'W obszarze znajdują się tylko niezbędne narzędzia i materiały' },
  { pillar: '1S', description: 'Stosowana jest strategia czerwonych etykiet dla wątpliwych przedmiotów' },
  { pillar: '1S', description: 'Brak nieaktualnych dokumentów lub zapisów w obszarze' },
  // 2S - Systematyka
  { pillar: '2S', description: 'Każdy przedmiot ma wyznaczone i oznaczone miejsce' },
  { pillar: '2S', description: 'Narzędzia i sprzęt są odkładane na swoje miejsce po użyciu' },
  { pillar: '2S', description: 'Oznaczenia podłogi i etykiety są widoczne i prawidłowe' },
  { pillar: '2S', description: 'Miejsca składowania są zorganizowane i dostępne' },
  // 3S - Sprzątanie
  { pillar: '3S', description: 'Stanowisko pracy i sprzęt są czyste i wolne od zanieczyszczeń' },
  { pillar: '3S', description: 'Harmonogram sprzątania jest wywieszony i przestrzegany' },
  { pillar: '3S', description: 'Brak wycieków oleju, rozlanych substancji ani widocznych zanieczyszczeń' },
  { pillar: '3S', description: 'Maszyny i narzędzia są utrzymane w dobrym stanie technicznym' },
  // 4S - Standaryzacja
  { pillar: '4S', description: 'Standardowe procedury operacyjne (SOP) są wywieszone i aktualne' },
  { pillar: '4S', description: 'Tablice zarządzania wizualnego są aktualne' },
  { pillar: '4S', description: 'Pracownicy stosują ustandaryzowane metody pracy' },
  { pillar: '4S', description: 'Wyniki audytów i działania naprawcze są widocznie śledzone' },
  // 5S - Samodyscyplina
  { pillar: '5S', description: 'Pracownicy są przeszkoleni z zasad 5S' },
  { pillar: '5S', description: 'Działania naprawcze z poprzedniego audytu zostały zamknięte' },
  { pillar: '5S', description: 'Kierownictwo aktywnie wspiera działania 5S' },
  { pillar: '5S', description: 'Pracownicy są zachęcani do zgłaszania sugestii doskonalenia' },
];

// Domyślne działy i strefy
export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'dept-metalowy',
    name: 'Wydział Metalowy',
    zones: [
      { id: 'zone-slusarnia', name: 'Ślusarnia' },
      { id: 'zone-pakowanie-metal', name: 'Pakowanie' },
      { id: 'zone-lakiernia', name: 'Lakiernia' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-drzewny',
    name: 'Wydział Drzewny',
    zones: [
      { id: 'zone-drzewny-ogolnie', name: 'Ogólnie' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-montazu',
    name: 'Wydział Montażu',
    zones: [
      { id: 'zone-lady', name: 'Lady' },
      { id: 'zone-tapicernia', name: 'Tapicernia' },
      { id: 'zone-montaz-szaf', name: 'Montaż szaf' },
      { id: 'zone-wycinanie', name: 'Wycinanie materiału' },
      { id: 'zone-okucia', name: 'Okucia' },
      { id: 'zone-kompletacja', name: 'Kompletacja' },
      { id: 'zone-blaty', name: 'Blaty' },
      { id: 'zone-szwalnia', name: 'Szwalnia' },
      { id: 'zone-klejenie', name: 'Klejenie' },
      { id: 'zone-krzesla', name: 'Linia krzeseł' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-magazyn-gotowych',
    name: 'Magazyn Wyrobów Gotowych',
    zones: [
      { id: 'zone-gotowych-ogolnie', name: 'Ogólnie' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dept-magazyn-materialow',
    name: 'Magazyn Materiałów',
    zones: [
      { id: 'zone-magazyn-glowny', name: 'Magazyn Główny' },
      { id: 'zone-magazyn-plyt', name: 'Magazyn płyt' },
    ],
    createdAt: new Date().toISOString(),
  },
];

// Legacy areas (for backward compatibility)
export const DEFAULT_AREAS: Omit<Area, 'id' | 'createdAt'>[] = [
  { name: 'Pakowanie', description: 'Obszar pakowania i etykietowania' },
  { name: 'Elementy Metalowe', description: 'Obróbka i składowanie części metalowych' },
  { name: 'Linia Montażowa', description: 'Główna linia montażowa' },
  { name: 'Magazyn', description: 'Składowanie surowców i wyrobów gotowych' },
  { name: 'Utrzymanie Ruchu', description: 'Warsztat utrzymania ruchu i składowanie narzędzi' },
];
