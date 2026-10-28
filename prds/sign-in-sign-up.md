<!--
Created: Oct 15, 2026
Created by: Julio Caunedo
Last updated: Oct 15, 2026
-->

# Sign In / Sign Up — Archie

**Location:** Entry point, unauthenticated (`/` before auth, replaces current `/login` + `/signup`)
**Audience:** Builders: founders, product teams and developers creating apps with Archie
**Description:** Single unified entry flow for authentication — no separate Sign In vs Sign Up path.

---

## Rationale: one path, not two

Traditional auth UIs ask the user to choose "Sign In" or "Sign Up" before they've entered anything. That choice is a common failure point — users forget whether they already have an account (especially once SSO is in the mix), pick the wrong path, and land on a dead-end error like "an account already exists, please sign in instead."

This flow removes that decision. The user is asked for one thing — their email — and the system determines whether they're new or returning, then branches accordingly:

- **Existing account, password-based** → password field is revealed inline, same screen
- **Existing account, SSO-based** → SSO button handles it, no email step needed
- **New email** → routed to account creation via email verification

This is the current industry-standard pattern ("identifier-first authentication"), used by Slack, Linear, Notion, Stripe, and Vercel.

**Trade-off:** this shifts complexity from the UI (two static forms) to the state machine (one form, several branches). The pattern only pays off if every branch is handled explicitly, which is why each branch below has a defined next action.

---

## Flow

### 1. Entry screen

Single screen, no route split. Contains:

| Element         | Behavior                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------- |
| SSO buttons     | Google, Microsoft, Github — each initiates provider OAuth directly, bypassing the rest of the flow |
| Divider         | "or continue with email"                                                                           |
| Email field     | Labeled "Work email"                                                                               |
| Continue button | Disabled (light/inactive) until a valid email is entered; becomes primary (solid) once filled      |
| Footer          | "Having trouble accessing your account? Contact Us" + Terms/Privacy links                          |

### 2. Submit email → branch

On "Continue", the system checks the email server-side and branches into one of three states on the **same screen** — plus a fourth case that leaves this screen entirely.

**a. Account found, password-based**
Password field is revealed below the email field. Button label changes to "Sign In".

A "Forgot password?" link sits at the top-right of the Password field in this state.

**b. Account found, but social-sign-in-linked (no password set)**
The email belongs to a real account, but it was created via Google/Microsoft/Github — there is no password to check against. No password field is shown; it has nothing to validate. The "Continue" button is also removed in this state — the SSO buttons above are the actual next action, so a button below that does nothing would be dead weight.

- Message: **"This email is linked to a Google account"** (name the actual provider — Google/Microsoft/Github)
- Body: **"Use the Google sign-in option above."**
- No CTA button in this state

Fallback copy if the provider can't be resolved: **"This email uses social sign-in"** / "Try Google, Microsoft, or Github above."

Terminology note: use **"social sign-in"**, not "SSO" — these are consumer OAuth buttons (personal Google/Microsoft/Github accounts), not enterprise SSO (SAML/OIDC federation with a company-managed IdP). If true enterprise SSO is added later, it needs its own distinct terminology so this ambiguity doesn't resurface.

> **Social sign-in** = authenticating with a consumer identity you already have (a personal Google, Github, or Facebook account) via that provider's OAuth. It's B2C-flavored — "sign in with Google" using your personal Gmail, no company IT involved.
>
> **SSO (Single Sign-On)** = an enterprise pattern where one credential/session, controlled by an organization's identity provider (Okta, Azure AD/Entra ID, Google Workspace as IdP), grants access across multiple internal and third-party apps. It's B2B-flavored — a company admin provisions/deprovisions access centrally, usually via SAML or OIDC federation tied to the company's own domain.

The specific-provider copy requires the "check email" endpoint to return which provider the account is linked to; otherwise the fallback copy is shown.

**c. Account not found (never signed up)**
Genuinely new email, no account exists. Unlike 2a/2b, this is a same-screen inline state, not an instant redirect: a warning banner appears below the email field — **"No account found"** / "Sign up to create an Archie account." — and the button label changes to "Sign Up." Clicking it routes into email verification ([step 3](#3-new-account--email-verification)), which sends the OTP immediately. This keeps signup passwordless up to that point; the inline state exists only to confirm intent before triggering the OTP send.

**d. Incorrect password**
Inline error: "Incorrect email or password — Check your email and password, then try again."

### 3. New account → email verification

For a new email, "Continue" surfaces the inline "No account found" state ([2c](#2-submit-email--branch)); clicking "Sign Up" from there routes here and sends the OTP immediately. This step confirms ownership before account creation completes. Password is intentionally not collected until _after_ verification succeeds (see [4. Set password](#4-set-password)) — no account credential is validated against an unverified email.

- **3A** Check your inbox — empty state — 6-digit code entry split 3+3, "Resend code" link
- **3B** Check your inbox — filled state — same screen, all 6 digits entered

The code auto-verifies as soon as all 6 digits are entered — there's no manual "Verify" action.

**3C** Verifying code — shown immediately after the 6th digit is entered, while the server checks the code: OTP inputs filled, small spinner + "Verifying code..." below, no "Resend code" link, no button.

**Error states:**

- **3F** Invalid code — inline error banner (red, alert icon): "Invalid code" / "Enter the latest 6-digit code sent to your email." OTP boxes outlined in red. "Resend code" link stays below.
- **3G** Code expired — inline error banner (amber, clock icon): "Code expired" / "Resend the code and try again." "Resend code" link stays below.

**Resend code:** clicking the link replaces it in place, in the same position, through two transient states, then reverts:

- Sending code... — small spinner + "Sending code..."
- Code resent — green checkmark + "Code resent," shown for ~2 seconds, then reverts to the initial "Resend code" link.

### 4. Set password

Shown only after OTP verification succeeds — this is what completes account creation, not a step before it.

**3E** Complete your profile — "Set your name and password to finish setting up your account." Collects **Full Name**, Password, and Confirm password — CTA **"Set password & Sign In"**.

Collecting the name alongside the already-verified email gives a complete profile (name + email) for account communication going forward.

**3D** Getting setup — loading state — shown after "Set password & Sign In" is clicked, while the account is created: Archie logo, spinner, "Getting setup..." — no user action, transitions automatically.

Verification success functions as the login — there's no separate login screen for a brand-new account. "Set password & Sign In" both completes signup and starts the session in one action.

### 5. SSO account creation

If a new user signs up via an SSO provider instead of email, the provider's own consent screen (e.g. Google "Choose an account") handles verification — no separate Archie verification step.

---

## Why OTP, not a magic link

OTP is the sole email-verification mechanism for new accounts (`3A`/`3B`).

Magic links can fail in work-email environments because tools like Gmail, Outlook, antivirus systems, and corporate security scanners may automatically open or scan links before the user clicks them. If the magic link is single-use, that scan can accidentally use up the link. When the user later clicks it, the link may already be expired or invalid — a confusing experience where the user did nothing wrong, but verification fails.

An OTP code is more reliable because the email client can scan the message without "using" the code. The user simply copies or enters the code manually, which avoids the risk of a security system burning the verification step before the user gets there.

---

## Implementation notes

- ⚠️ **Gap:** the "check email" endpoint needs to return which provider (if any) a social-sign-in-linked account uses, so step 2b can show provider-specific copy instead of the generic fallback.
