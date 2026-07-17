# Dezprox Hiring Platform - Runtime Testing Checklist

This checklist covers manual verification of the platform across all roles.

## 1. Candidate Experience
- [ ] **Login**: Can log in with provided credentials.
- [ ] **Assessment Start**: Can start an assigned assessment.
- [ ] **MCQ/Typing**: Answers are saved correctly.
- [ ] **Coding Editor**: 
  - [ ] Syntax highlighting works.
  - [ ] Autosave triggers (verify in Network tab/Socket.IO).
- [ ] **Connectivity**:
  - [ ] Disconnect internet: UI shows offline status/warning.
  - [ ] Reconnect internet: Socket.IO re-establishes connection and syncs state.
- [ ] **Anti-Cheat**:
  - [ ] Switching tabs triggers an alert/log.
  - [ ] Copy-pasting code triggers an alert/log.
- [ ] **Submission**: Final submit works and redirects to success page.

## 2. HR / Recruiter Experience
- [ ] **Candidate Management**:
  - [ ] Create candidate and send invitation email.
  - [ ] View candidate list and search by name/role.
- [ ] **Monitoring**:
  - [ ] Real-time status updates (Online/Offline/In-Progress).
  - [ ] View active assessment progress.
- [ ] **Reports**:
  - [ ] Generate and view candidate reports.

## 3. Manager Experience
- [ ] **Review Queue**: View pending coding reviews.
- [ ] **Coding Review**:
  - [ ] View candidate's code submission.
  - [ ] View AI-generated feedback and score.
  - [ ] Add manual comments and final rating.
- [ ] **Approve/Reject**: Final decision updates candidate status.

## 4. Admin Experience
- [ ] **Analytics**:
  - [ ] View dashboard with hiring funnel stats.
  - [ ] View assessment completion rates.
- [ ] **Question Bank**:
  - [ ] Add/Edit MCQ and Coding questions.
  - [ ] Import questions in bulk.
- [ ] **Monitoring**:
  - [ ] View Prometheus/Grafana metrics (if configured).
  - [ ] Check Sentry for any runtime errors.

## 5. System Integrity
- [ ] **Health Endpoints**: `/health` returns 200 OK for API and Frontend.
- [ ] **Database**: Migrations run correctly on a fresh install.
- [ ] **Redis**: Workers process jobs from the queue without lag.
- [ ] **Nginx**: 
  - [ ] WebSocket upgrade works (101 Switching Protocols).
  - [ ] Gzip compression is active.
  - [ ] SPA routing handles page refreshes.
