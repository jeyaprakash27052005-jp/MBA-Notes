# MBA Notes - Security Specification & Access Matrix

## 1. Data Invariants
1. **User Identity Invariant**: A user's profile document `/users/{userId}` can only be created or modified with high privileges (HOD) or self-updated for limited fields (e.g., password change flag, phone, address). Role (`hod`, `teacher`, `student`) and `userId` are strictly guarded against privilege escalation.
2. **Student Read-Only Invariant**: Students can NEVER create, update, or delete any academic entities (batches, timetable, notes, assignments).
3. **Batch Isolation Invariant**: Student users can only list and view assignments, notes, and timetable entries intended for their specific `batchId`.
4. **Note File Validity Invariant**: Uploaded notes must only possess extensions `pdf`, `pptx`, `docx`, `xlsx`, and the file size must not exceed 20MB (20,971,520 bytes).
5. **Assignment Submission Invariant**: Students can only submit or update their own submission document where `studentId == request.auth.uid`. Teachers and HOD can mark or adjust submission statuses (`Submitted`, `Pending`, `Late`).
6. **Timetable & Batch Integrity**: Timetable slots belong to valid batches; only HOD can create/edit batches and timetable entries.
7. **Admin Bootstrap Integrity**: The master system admin `/admins/{adminId}` is keyed to trusted administration accounts (`jeyaprakash27052005@gmail.com`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Privilege Escalation on User Create)**: A student attempts to write `{ "userId": "25MBA99", "role": "hod", "name": "Fake HOD" }`. (Expected: PERMISSION_DENIED)
2. **Payload 2 (Student Writes Assignment)**: A student attempts to create `/assignments/hack1` with `{ "title": "Free A+", "batchId": "2025-27", "createdBy": "25MBA01" }`. (Expected: PERMISSION_DENIED)
3. **Payload 3 (Teacher Deletes Batch)**: A teacher attempts to delete `/batches/2025-27`. (Expected: PERMISSION_DENIED - Only HOD can delete batches)
4. **Payload 4 (Student Deletes Notes)**: A student attempts to delete `/notes/note-101`. (Expected: PERMISSION_DENIED)
5. **Payload 5 (Illegal File Type in Notes)**: A user attempts to create a note with `"fileType": "exe"` or `"bat"`. (Expected: PERMISSION_DENIED)
6. **Payload 6 (Oversized Note Payload)**: A user attempts to inject an oversized title (>200 chars) or note payload exceeding volumetric constraints. (Expected: PERMISSION_DENIED)
7. **Payload 7 (Student Alters Another Student's Submission)**: Student `25MBA02` attempts to overwrite submission document `/submissions/sub-25MBA01` belonging to `25MBA01`. (Expected: PERMISSION_DENIED)
8. **Payload 8 (Ghost Field Attack)**: An attacker injects `{ "isAdmin": true, "superUser": true }` into `/users/{userId}`. (Expected: PERMISSION_DENIED)
9. **Payload 9 (Cross-Batch Data Tampering)**: A teacher creates timetable slots for batches they are not authorized to schedule. (Expected: PERMISSION_DENIED)
10. **Payload 10 (Student Mutates Timetable)**: A student attempts to modify `/timetable/slot-1`. (Expected: PERMISSION_DENIED)
11. **Payload 11 (Unauthenticated Write)**: An unauthenticated request attempts to create or update any document. (Expected: PERMISSION_DENIED)
12. **Payload 12 (Admin Doc Impersonation)**: A regular user attempts to write into `/admins/{uid}` to grant themselves admin status. (Expected: PERMISSION_DENIED)

## 3. Test Runner Design
The companion test suite `firestore.rules.test.ts` asserts that all 12 dirty payloads are strictly rejected by the ABAC Fortress rules.
