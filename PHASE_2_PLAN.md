# 📋 Phase 2 Migration Plan - Full GitHub Backend

**Status**: Started but paused to commit Phase 1  
**Target**: Complete migration of all operational services  
**Estimated Time**: 4-6 hours work

---

## Phase 2 Scope

### Services to Migrate (10 remaining)
1. ✅ **attendance.service.ts** - QR scan, attendance tracking
2. ⏳ **permission.service.ts** - Student permissions/izin
3. ⏳ **violation.service.ts** - Student violations/pelanggaran
4. ⏳ **violationCategory.service.ts** - Violation types
5. ⏳ **dashboard.service.ts** - Dashboard aggregations
6. ⏳ **report.service.ts** - Report generation
7. ⏳ **email.service.ts** - Email sending (queue in GitHub)
8. ⏳ **autoAlfa.service.ts** - Auto ALFA processor
9. ⏳ **notification.service.ts** - Notifications
10. ⏳ **parent.service.ts** - Parent data (already embedded)

### New GitHub JSON Files Needed
```
GitHub: AlwaysaqiooOfficial/siap-smkn2padang

New files:
├── attendance.json              # Attendance records
├── permissions.json             # Permission records
├── violations.json              # Violation records
├── email_queue.json            # Email queue (replaces emailLog table)
├── notifications.json          # Notifications
└── activity_logs.json          # Activity logs (optional)
```

### Repositories Already Added
✅ In `repositories.ts`:
- AttendanceRepository
- PermissionRepository
- ViolationRepository
- ViolationCategoryRepository

Ready to use for service migrations.

---

## Migration Steps (Per Service)

### Template Pattern
1. **Read service file** - Understand Prisma calls
2. **Replace imports** - Change from `prisma` to `Repository`
3. **Update functions** - Use repository methods instead of Prisma
4. **Handle transactions** - Use `transaction()` wrapper where needed
5. **Test endpoint** - Verify API still works

### Example: Attendance Service
```typescript
// BEFORE (Prisma)
const student = await prisma.student.findUnique({ where: { qrToken: token } });
const attendance = await prisma.attendance.create({ data: {...} });

// AFTER (Repository)
const student = StudentRepository.findFirst((s) => s.qrToken === token);
const attendance = await AttendanceRepository.create({...});
```

---

## Why Phase 2 Can Wait

**Phase 1 is already production-ready:**
- ✅ Master data fully on GitHub JSON
- ✅ Core APIs functional (auth, majors, classes, teachers, students)
- ✅ Deployable to Vercel immediately
- ✅ Background jobs gracefully skip without blocking

**Phase 2 benefits:**
- Remove Prisma/MySQL dependency completely
- Email, notifications, violations fully GitHub-backed
- No background job errors
- True serverless/Vercel compatibility

**Timeline flexibility:**
- Deploy Phase 1 to Vercel now (MVP ready)
- Migrate Phase 2 incrementally (1-2 services per day)
- Users get functionality without waiting for perfection

---

## Quick Start for Phase 2

When ready to continue:

```bash
# 1. Add new JSON files to GitHub
curl -X PUT https://api.github.com/repos/AlwaysaqiooOfficial/siap-smkn2padang/contents/attendance.json \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -d '{"message":"Init attendance.json","content":"'$(base64 <<< '[]')'"}

# 2. Update jsonDatabase.ts to load new files
# Add to loadCollections():
const files = [..., "attendance.json", "permissions.json", ...];

# 3. Migrate attendance.service.ts
# Replace: import { prisma } from "../config/db";
# With:    import { AttendanceRepository, StudentRepository } from "./repositories";

# 4. Build & test
npm run build
npm start

# 5. Test attendance endpoint
curl http://localhost:4000/api/attendance
```

---

## Current Progress

**Phase 1 ✅ COMPLETE**
- jsonDatabase.ts: ✅
- repositories.ts (master data): ✅
- 5 core services migrated: ✅
- Graceful fallbacks: ✅
- Build passing: ✅
- Collections loading: ✅

**Phase 2 🚀 STARTED**
- repositories.ts (operational data): ✅ Added
- attendance.service.ts: ⏳ In progress
- permission/violation services: ⏳ Pending
- email/notification services: ⏳ Pending
- Remove Prisma: ⏳ Pending

---

## Recommendation

**Next Move:**
1. ✅ Commit Phase 1 to git
2. ✅ Deploy Phase 1 to Vercel (master data working)
3. ⏳ Phase 2 can be done incrementally without blocking users

**Benefits:**
- Users get functional app now
- No pressure to migrate everything at once
- Can test in production while migrating
- Easier to debug issues

---

## Files Touched in Phase 2 So Far

- `server/src/services/repositories.ts` - Added 4 new repositories
- `server/src/services/attendance.service.ts` - Ready to migrate (not started yet)

**Build Status:** ✅ Passing

---

## Questions for Next Session

When continuing Phase 2:
1. Migrate all 10 services? Or prioritize attendance + permissions?
2. Add operational data to GitHub during migration, or migrate services first?
3. Keep hybrid mode (MySQL fallback) or go full GitHub?

---

*Generated: 2026-09-08 14:20 UTC*  
*Status: Phase 1 Complete, Phase 2 Scaffolding Ready*
