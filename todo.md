# 5S Audit App — TODO

## Branding & Setup
- [x] Generate app logo and update app.config.ts
- [x] Update theme colors (industrial blue palette)
- [x] Update icon-symbol.tsx with all required icons

## Data Layer
- [x] Create data types (Area, Audit, AuditItem, NonConformance, Task)
- [x] Create storage context with AsyncStorage persistence
- [x] Seed default 5S checklist items per pillar
- [x] Seed default factory areas

## Navigation
- [x] Configure 4-tab layout (Home, Audit, Tasks, Reports)
- [x] Add stack screens for audit flow

## Home Screen
- [x] Dashboard with stats (audits this month, open tasks, avg score)
- [x] Recent audits list
- [x] Start New Audit CTA button

## Audit Flow
- [x] Area selection screen
- [x] Audit checklist screen with 5S pillars
- [x] Pass / Partial / Fail toggle per item
- [x] Non-conformance modal (photo + description + severity)
- [x] Photo capture via camera and gallery picker
- [x] Live score calculation
- [x] Audit summary screen with scores per pillar
- [x] Auto-create tasks from non-conformances

## Tasks
- [x] Tasks list screen with tab filters (All / Open / In Progress / Done)
- [x] Task detail screen (status, notes, due date, photos)
- [x] Mark task as done

## Reports
- [x] Reports list screen with past audits
- [x] Report detail screen with full breakdown
- [x] PDF export of audit report

## Areas Management
- [x] Areas list (within settings or home)
- [x] Add / edit / delete areas

## Lokalizacja (Polish Translation)
- [x] Przetłumacz typy danych: etykiety filarów, domyślne obszary, elementy listy kontrolnej
- [x] Przetłumacz ekran główny (Home)
- [x] Przetłumacz ekran wyboru obszaru i listę kontrolną audytu
- [x] Przetłumacz ekran podsumowania audytu
- [x] Przetłumacz ekran zadań i szczegółów zadania
- [x] Przetłumacz ekran raportów i szczegółów raportu
- [x] Przetłumacz ekran zarządzania obszarami

## Hierarchiczna struktura obszarów (Działów i Stref)
- [ ] Update types.ts - dodaj Department i Zone typy
- [ ] Seed domyślne działy z ich strefami
- [ ] Update AppContext - obsługa hierarchii
- [ ] Rebuild ekranu wyboru obszaru - dwa kroki (dział → strefa)
- [ ] Update ekranów audytu, zadań, raportów - pokazanie hierarchii
- [ ] Test pełny przepływ audytu z nową hierarchią
