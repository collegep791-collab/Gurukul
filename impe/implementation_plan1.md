# Gurukul — Production Stability & Feature Expansion Plan

Addressing critical bugs (Admin "Add User", Mobile 404s) and implementing requested academic features.

## 1. Critical Bug Fixes

### [FIX] Mobile Pages "Not Loading"
- **Problem:** `BottomNav.jsx` currently generates paths like `/student/resources`. However, `App.jsx` defines the route as `/resources`. This causes a 404 on mobile.
- **Solution:** Clean up `BottomNav.jsx` to use absolute routes (`/resources`, `/chat`, etc.) without pre-calculating a role-based prefix.

### [FIX] Admin "Add User" Button
- **Problem:** The button exists in the UI but has no logic attached.
- **Solution:** 
  - Add `createUser` method to `DataContext.jsx`.
  - Create a modal in `Users.jsx` to collect Name, Email, Password, Role, USN, Class, and Section.
  - Implement `POST /api/users` in the backend for Admins only.

---

## 2. Academic Identity (USN, Class, Section)

### [DATABASE] [modify] [db.js](file:///Users/staruntejas/Desktop/Gurukul/server/db.js)
- Add columns: `usn` (TEXT), `class` (TEXT), `section` (TEXT).
- Add `created_by` to `chat_channels`.

### [BACKEND] [modify] [auth.js](file:///Users/staruntejas/Desktop/Gurukul/server/routes/auth.js)
- **Registration Security:** Force `role = 'STUDENT'` on registration request. 
- **Validation:** Validate USN against pattern `1RL24SCSXX`.
- **Field Handling:** Save `usn`, `class`, and `section` on signup.

### [FRONTEND] [modify] [Login.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/pages/Login.jsx)
- Update **Registration form** with new fields:
  - USN (e.g. 1RL24SCS01)
  - Class (Dropdown: 1st Year, 2nd Year, etc.)
  - Section (Dropdown: A, B, C, D)

---

## 3. Communication & Privacy

### [FEATURES] Class Group Chats
- **Teacher Authority:** Teachers will have a "Create Class Group" button in the Chat sidebar.
- **Auto-Enrollment:** When a channel is created (e.g., "3rd Year - Sec A - Data Science"), the server will automatically find all students matching that `class` and `section` and add them to the `chat_channel_members`.

### [FEATURES] Profile Picture Uploads
- Implement `PATCH /api/users/me/avatar` with `multer` for image processing.
- Connect the camera icon in `Settings.jsx` to a real file picker and API call.

---

## 4. Mobile COMPATIBILITY Overhaul

- **TopNav:** Ensure the search bar and notifications don't overlap on 320px screens.
- **Chat:** On mobile, implement a "Side-by-Side to Stacked" transition. Users see the channel list first; clicking a channel "navigates" to the message view (with a back button).
- **Assignments:** Fix card layout to 1-column on mobile.
- **Settings:** Move sidebar tabs to a horizontal scroll or dropdown for mobile screens.

---

## User Review Required

> [!IMPORTANT]
> **Registration Access:** As per security best practices, **everyone** who signs up will be a **Student** initially. If a Teacher registers, you (the Admin) must go to the **Users** page and change their role to "Teacher". This prevents unauthorized people from gaining teacher privileges.

> [!NOTE]
> **USN Validation:** I will enforce the `1RL24SCSXX` format. If a user enters something else, it will show a validation error during registration.

---

## Verification Plan

### Manual Tests
1. **Admin Fix:** Log in as Admin -> Add User -> Verify new user can log in.
2. **Mobile Fix:** Toggle "Responsive" in browser -> Click "Resources" in BottomNav -> Verify it loads (not 404).
3. **Academic Data:** Signup -> Check USN/Class/Section in DB and Profile page.
4. **Chat Privacy:** Create group as Teacher -> Login as student from different class -> Verify student *cannot* see that group.
