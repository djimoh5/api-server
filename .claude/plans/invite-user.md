# Plan: Invite Feature API

## Context

Add an invite flow so authenticated users can invite new people by email. An invited user is stored as a "virtual" `UserAuth` (marked with `virtual: true`) until they complete registration. The invite email contains a magic link with a one-time code. Clicking the link lets the frontend auto-log the user in via the API. On registration, the virtual flag is stripped and the account becomes a full user.

Login and registration are modified to be aware of virtual users: login rejects them (they have no real password), and registration converts them rather than blocking as a duplicate.

---

## Files to Modify

| File | Change |
|------|--------|
| `model/auth.model.ts` | Add `virtual?`, `inviteCode?`, `inviteExpiry?` to `UserAuth` |
| `server/config/config.base.ts` | Add `APP_URL: string = ''` for magic link base URL |
| `server/repository/auth.repository.ts` | Add `getByInviteCode(code)` method |
| `server/service/auth.service.ts` | Add `invite()`, `redeemInviteCode()`; modify `login()`, `register()`, `persistAuth()` |
| `server/controller/api.controller.ts` | Add `POST /auth/invite` and `POST /auth/invite/redeem` endpoints |

---

## Detailed Changes

### 1. `model/auth.model.ts`

Add three optional fields to `UserAuth`:

```typescript
virtual?: boolean;       // true = invited but not yet registered
inviteCode?: string;     // unique one-time code for the magic link
inviteExpiry?: number;   // Unix ms timestamp, 7 days from invite creation
```

### 2. `server/config/config.base.ts`

Add one field to the base config class:

```typescript
APP_URL: string = '';    // override per env (e.g. 'https://app.example.com')
```

### 3. `server/repository/auth.repository.ts`

Add one method:

```typescript
getByInviteCode(code: string): Promise<UserAuth> {
    return this.context.findOne({ inviteCode: code, virtual: true });
}
```

### 4. `server/service/auth.service.ts`

**Constructor**: inject `EmailService` alongside existing `AppService` and `AuthRepository`.

**New method `invite(username: string)`**:
- Call `getByUsername(username)` (no password field) to check existence
- If user exists and `!virtual` → return `ApiResponse(false, null, 'user already exists')`
- If user exists and `virtual` → reuse existing record, update code + expiry
- If no user → create `new UserAuth(username, '')` with `virtual = true`
- Generate `inviteCode = Common.uniqueId()`; set `inviteExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000`
- Save via `authRepository.update(auth)`
- Send email via `emailService.sendTemplate({ to: [username], subject: 'You\'ve been invited', buttonText: 'Accept Invite', buttonLink: \`${Config.APP_URL}/invite?code=${inviteCode}\` }, auth.oid)`
- Return `ApiResponse(true, null)` (don't expose the code in the response)

**New method `redeemInviteCode(code: string)`**:
- Call `authRepository.getByInviteCode(code)`
- If not found → return `ApiResponse(false, null, 'invalid invite code')`
- If `Date.now() > auth.inviteExpiry` → return `ApiResponse(false, null, 'invite code has expired')`
- Delete `auth.password`; return `ApiResponse(true, auth)` — caller creates a session

**Modify private `login(auth, password, bypassPassword?)`**:
- Add check: if `auth?.virtual` → treat as not found → return `ApiResponse(false, null, 'username or password incorrect')`
- (Virtual users cannot log in with a password; they must use the magic link)

**Modify private `register(auth, username, password)`**:
- Change condition from `if (!auth)` to `if (!auth || auth.virtual)` so a virtual user can proceed to registration
- Pass the existing `auth` object to `persistAuth` when converting

**Modify private `persistAuth(username, password, existingAuth?: UserAuth)`**:
- If `existingAuth` is provided (virtual→real conversion): update that object in place — set new hashed password, delete `virtual`, `inviteCode`, `inviteExpiry`; save and return
- Otherwise: create `new UserAuth(username, hash)` as before

### 5. `server/controller/api.controller.ts`

**Add `POST /auth/invite`** (no `@NoAuth()` — requires a valid session):
```typescript
@Post('auth/invite')
async invite(req: Request, res: Response) {
    const data = await this.authService.invite(req.body.username);
    res.send(data);
}
```

**Add `POST /auth/invite/redeem`** (public):
```typescript
@NoAuth()
@Post('auth/invite/redeem')
async redeemInvite(req: Request, res: Response) {
    const data = await this.authService.redeemInviteCode(req.body.code);
    if (data.success) {
        req.session.user = data.data;
        await this.init(req);
        req.session.start(data.data);
    }
    res.send(data);
}
```

---

## Magic Link Flow

```
1. Authenticated user  →  POST /api/auth/invite  { username: "new@example.com" }
2. Server creates virtual UserAuth (virtual=true, inviteCode=<uuid>, inviteExpiry=+7d)
3. Server sends email with link: <APP_URL>/invite?code=<uuid>
4. Invited user clicks link → frontend reads ?code= from URL
5. Frontend calls  →  POST /api/auth/invite/redeem  { code: "<uuid>" }
6. Server validates code → returns JWT in response headers + UserAuth in body
7. User is now logged in as virtual user (they should be prompted to set a password / complete registration)
8. User calls  →  POST /api/auth/create  { username, password }
9. Server finds existing virtual record, converts it → real UserAuth (virtual/inviteCode/inviteExpiry removed)
```

---

## Verification

- `POST /auth/invite` without auth → 401 / session error (middleware blocks it)
- `POST /auth/invite` with auth, new email → `{ success: true }` + virtual doc in `agent_auth` with `virtual: true`
- `POST /auth/invite` with auth, same email again → re-sends with new code, same oid preserved
- `POST /auth/invite` with auth, email of existing real user → `{ success: false, msg: 'user already exists' }`
- `POST /auth` (login) with virtual user's username + any password → `{ success: false, msg: 'username or password incorrect' }`
- `POST /auth/invite/redeem` with valid code → `{ success: true, data: UserAuth }` + JWT in response headers
- `POST /auth/invite/redeem` with expired code → `{ success: false, msg: 'invite code has expired' }`
- `POST /auth/invite/redeem` with invalid code → `{ success: false, msg: 'invalid invite code' }`
- `POST /auth/create` with virtual user's username + valid password → virtual flag removed, real user created
- `POST /auth/create` with virtual user's username + weak password → `{ success: false, msg: <password requirements> }`
