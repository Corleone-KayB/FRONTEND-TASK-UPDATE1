export type UserRole = "PATIENT" | "THERAPIST" | "ADMIN";

// --- Real backend API types (Auth Service) ---

// /login and /refresh both only ever return this - no separate `user` object.
export interface AuthTokenResponse {
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  userName: string;
}

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type SessionType = "VIDEO" | "AUDIO";

// --- Real backend API types (Appointment Service + User Service) ---
// See src/lib/appointments-api.ts for the endpoints these are fetched from.

export interface TherapistProfile {
  id: string;
  userId: string;
  userName: string | null;
  bio: string | null;
  timezone: string;
  languagePreference: string;
  specialisation: string | null;
  languages: string[];
  isAcceptingPatients: boolean;
  photoUrl: string | null;
}

// The Appointment Service's own appointment shape - only carries therapistId
// (see TherapistProfile.userId to resolve a name), not a denormalized name/initials.
export interface BookedAppointment {
  id: string;
  patientId: string;
  therapistId: string;
  slotStart: string;
  slotEnd: string;
  sessionType: SessionType;
  status: AppointmentStatus;
  cancellationReason: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  slotStart: string;
  slotEnd: string;
}

// Opt-out model - all three channels default to true.
export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface UpdateProfileRequest {
  userName?: string;
  bio?: string;
  timezone?: string;
  languagePreference?: string;
}

export interface Profile {
  userName: string | null;
  bio: string | null;
}

// GET /api/v1/users/me
export interface MeResponse {
  role: "PATIENT" | "THERAPIST" | "ADMIN";
  profile?: Profile;
  message?: string;
}

export interface UserPreferencesResponse {
  fcmToken: string | null;
  email: string | null;
  phoneNumber: null; // not currently collected, per the spec
  userName: string | null;
  notificationPreferences: NotificationPreferences;
}

// --- Real backend API types (Notification Service - in-app notifications) ---
// See src/lib/notifications-api.ts. These sit alongside the existing admin-only
// GET /api/v1/notifications/logs, but are callable by any authenticated role for
// their own notifications. title/body are already human-readable display text
// from the server, not raw eventType strings - render them directly.

export interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  readAt: string | null;
  createdAt: string;
}

// GET /api/v1/notifications?page=&limit=
export interface NotificationsListResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

// --- Real backend API types (Mood Tracking Service) ---
// See src/lib/mood-api.ts. Response shapes for everything but LogMoodRequest aren't
// schema'd in the service's OpenAPI spec (prose descriptions only) - treat these as
// best-effort until verified against a running backend.

export interface LogMoodRequest {
  moodScore: number;
  emotions?: string[];
  sleepHours?: number;
  stressLevel?: number;
  energyLevel?: number;
  journalNote?: string;
  triggers?: string[];
  // Omit for a normal check-in. Supply to backfill a missed day - must not be
  // future (5min skew tolerance) or >365 days ago, or the server 400s.
  recordedAt?: string;
}

// PUT /api/v1/mood/:id - send only what changes; omitted fields stay as-is.
// journalNote: null clears the note; leave the key out entirely to leave it
// untouched (JSON.stringify already drops `undefined` keys, so this falls out
// naturally from a partial object rather than needing special-casing).
export interface UpdateMoodRequest {
  moodScore?: number;
  emotions?: string[];
  sleepHours?: number;
  stressLevel?: number;
  energyLevel?: number;
  journalNote?: string | null;
  triggers?: string[];
}

export interface MoodEntry {
  id: string;
  userId: string;
  moodScore: number;
  emotions: string[];
  sleepHours: number | null;
  stressLevel: number | null;
  energyLevel: number | null;
  journalNote: string | null;
  triggers: string[];
  recordedAt: string;
  createdAt: string;
}

// GET /api/v1/mood/today?timezone=... - call on check-in page mount. Always
// pass Intl.DateTimeFormat().resolvedOptions().timeZone; the server defaults to
// UTC otherwise, which is wrong for most local "today" boundaries.
export interface MoodTodayResponse {
  hasCheckedIn: boolean;
  localDate: string;
  timezone: string;
  entriesToday: number;
  remainingToday: number;
  entry: MoodEntry | null;
}

// Verified against the live API - field is `streak`, not `currentStreak`.
export interface MoodStreak {
  streak: number;
  lastCheckedIn: string | null;
}

// GET /api/v1/mood/summary - for charts (unlike /history's raw entry list).
// No zero-filling: sparse ranges produce sparse `buckets`, not entryCount: 0
// entries, so a chart consuming this needs to handle discontinuous x-values.
export interface MoodSummaryBucket {
  bucketStart: string;
  avgMood: number;
  avgSleep: number;
  avgStress: number;
  avgEnergy: number;
  minMood: number;
  maxMood: number;
  entryCount: number;
}

export interface MoodSummaryResponse {
  startDate: string;
  endDate: string;
  granularity: "day" | "week" | "month";
  totalEntries: number;
  avgMood: number;
  buckets: MoodSummaryBucket[];
}

// --- Real backend API types (AI Integration Service) ---

// crisisLevel is 0-5. Only 5 is a safety interstitial - fixed clinical copy,
// sessionId always null, the AI provider never actually called for that turn.
// 1-4 render as an ordinary reply; the backend's crisis-response behavior below
// level 5 is still being redefined, so don't branch UI on those values.
export interface ChatResponse {
  response: string;
  crisisLevel: number;
  sessionId: string | null;
}

// GET /api/v1/ai/history - newest first. One item is a full exchange (both
// sides), not a single message - don't try to pair separate user/assistant rows.
export interface AiInteraction {
  id: string;
  sessionId: string | null;
  message: string | null; // null if this row couldn't be decrypted
  response: string | null; // null if this row couldn't be decrypted
  crisisLevel: number;
  createdAt: string;
}

export interface AiHistoryResponse {
  interactions: AiInteraction[];
  total: number;
  page: number;
  limit: number;
}

// DELETE /api/v1/ai/history
export interface DeleteAiHistoryResponse {
  message: string;
  localInteractionsDeleted: number;
  // false means the transcript may still exist on the third-party AI provider's
  // servers - must be surfaced honestly, never reported as a completed deletion.
  remoteConversationDeleted: boolean;
}

// --- Real backend API types (Admin Service) ---

export interface AdminUserRecord {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  actionType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SystemAlert {
  id: string;
  eventType: "AI_CRISIS" | "MOOD_CONCERN";
  severity: "HIGH" | "MEDIUM" | "LOW";
  payload: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
}

// Every field is null (never 0) if that specific dependent service was unreachable -
// the endpoint always returns 200, per the /analytics description.
export interface PlatformAnalytics {
  totalUsers: number | null;
  activeUsersLast30Days: number | null;
  totalAppointments: number | null;
  completedAppointments: number | null;
  totalMoodEntries: number | null;
  avgMoodScorePlatform: number | null;
  totalCommunityPosts: number | null;
  totalAiInteractions: number | null;
  totalCrisisEvents: number | null;
}

// GET /api/v1/admin/analytics/detailed - aggregated in parallel from every
// service, same as /analytics above. Each of users/therapists/appointments is
// null (not an object of nulls) if that specific service was unreachable - the
// endpoint always returns 200. registrationTrend/applicationTrend/sessionTrend
// are sparse: a day with zero events is simply absent from the array, not a
// zero-value entry. usersByRole/byStatus/statusBreakdown are objects keyed by
// the relevant enum - a key with zero count is absent, not present with 0.
export interface AnalyticsTrendPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface UserAnalytics {
  totalUsers: number;
  usersByRole: Partial<Record<UserRole, number>>;
  newUsersInRange: number;
  suspendedUsers: number;
  dau: number;
  wau: number;
  mau: number;
  registrationTrend: AnalyticsTrendPoint[];
}

export interface TherapistApplicationAnalytics {
  byStatus: Partial<Record<TherapistApplicationStatus, number>>;
  // 0-1 fractions, not already-formatted percentages.
  approvalRate: number;
  rejectionRate: number;
  applicationTrend: AnalyticsTrendPoint[];
}

export interface TherapistAnalytics {
  totalTherapists: number;
  suspendedTherapists: number;
  applications: TherapistApplicationAnalytics;
}

export interface AnalyticsSessionTrendPoint {
  date: string; // YYYY-MM-DD
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
}

export interface AppointmentAnalytics {
  totalAppointments: number;
  completedAppointments: number;
  statusBreakdown: Partial<Record<AppointmentStatus, number>>;
  // 0-1 fractions, not already-formatted percentages.
  completionRate: number;
  cancellationRate: number;
  sessionTrend: AnalyticsSessionTrendPoint[];
}

export interface DetailedAnalytics {
  range: { from: string; to: string };
  users: UserAnalytics | null;
  therapists: TherapistAnalytics | null;
  appointments: AppointmentAnalytics | null;
}

// --- Real backend API types (Messaging Service) ---
// Realtime is Socket.io (src/lib/messaging-socket.ts); conversation lists, message
// history/pagination, and presence lookups go through Kong as real REST (src/lib/
// messaging-api.ts). The socket connects directly to the messaging service, not
// through Kong - see NEXT_PUBLIC_SOCKET_URL vs NEXT_PUBLIC_API_URL.

// lastSeen expires ~5 minutes after disconnect and becomes null - there's no
// "last seen 3 days ago", only a recent-or-nothing signal.
export interface PresenceStatus {
  userId: string;
  online: boolean;
  lastSeen: string | null;
}

// Same shape whether it arrives via new_message/message_history (socket) or
// GET /conversations/:id (REST) - one rendering path for all three.
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  // Set once the recipient has actually opened the conversation (true delivery,
  // not presence) and never changes again after that, even once read. null until
  // then.
  deliveredAt: string | null;
  // Set by mark_read/mark_conversation_read. null until read.
  readAt: string | null;
}

export interface ConversationParticipant {
  userId: string;
  userName: string | null;
}

export interface Conversation {
  _id: string;
  participants: string[];
}

// GET /api/v1/messaging/conversations list item, and the shape POST .../conversations
// returns for a single conversation (create-or-get). participantName can be null -
// it's resolved from another service and falls back to null on failure.
export interface ConversationSummary {
  conversationId: string;
  participantId: string;
  participantName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/v1/messaging/conversations/:id - newest-first. Pass the previous
// nextCursor back as `cursor` to page further back; null means start of history.
export interface ConversationHistoryResponse {
  messages: Message[];
  nextCursor: string | null;
}

// --- Real backend API types (Therapist Application feature) ---
// Applicant-facing routes live under /api/v1/users/therapist-applications (User
// Service, see src/lib/therapist-application-api.ts); admin routes live under
// /api/v1/admin/therapist-applications and /api/v1/admin/therapists (Admin
// Service, see src/lib/admin-api.ts).

export type TherapistApplicationStatus =
  "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "MORE_INFORMATION_REQUIRED";

export type TherapistDocumentType = "LICENSE" | "CERTIFICATION" | "ID" | "OTHER";

export interface TherapistDocument {
  id: string;
  applicationId: string;
  documentType: TherapistDocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  // Only present when fetched via the signed-download-URL endpoint, or in
  // the admin detail view - never on the plain applicant document list.
  url?: string;
}

// Internal reviewer commentary - admin-only, appears in the admin detail
// view's `notes[]` and is never returned to the applicant.
export interface TherapistApplicationNote {
  id: string;
  applicationId: string;
  authorId: string;
  note: string;
  createdAt: string;
}

export interface TherapistApplication {
  id: string;
  userId: string;
  status: TherapistApplicationStatus;
  fullName: string;
  phoneNumber: string;
  contactEmail: string;
  professionalBio: string;
  qualifications: string[];
  certifications: string[];
  licenseNumber: string;
  licenseIssuingBody: string;
  licenseExpiryDate: string | null;
  professionalRegistrationNumber: string | null;
  specialisations: string[];
  yearsOfExperience: number;
  languages: string[];
  availabilitySummary: string | null;
  location: string;
  timezone: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  // Applicant-visible record of the last REJECTED/MORE_INFORMATION_REQUIRED
  // decision - persisted (not just emailed) so the applicant can still see
  // why on a later visit, not only in a one-off notification they may have
  // missed. Only the one matching the current `status` is meaningful; the
  // other is stale from a prior decision, if the application was resubmitted.
  rejectionReason: string | null;
  infoRequestNote: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on the applicant's GET /me and the admin detail view.
  documents?: TherapistDocument[];
  // Admin detail view only - never present on the applicant's GET /me.
  notes?: TherapistApplicationNote[];
}

// --- Real backend API types (Appointment Service - therapist dashboard,
// own-availability, and patients endpoints). See src/lib/appointments-api.ts.

// GET /api/v1/appointments/dashboard - therapist only. todaysSessions items
// are the ordinary BookedAppointment shape above (status=CONFIRMED, today
// only) - there's no denormalized patient name on them, just patientId.
export interface TherapistDashboard {
  todaysSessions: BookedAppointment[];
  pendingCount: number;
  upcomingCount: number;
  patientCount: number;
}

export interface WorkingHoursWindow {
  dayOfWeek: number; // 0=Sunday..6=Saturday, matches JS Date.getDay()
  startMinute: number; // minutes since midnight, Africa/Kigali local time (fixed UTC+2, no DST)
  endMinute: number;
}

// GET /api/v1/appointments/availability (own schedule, therapist only) -
// distinct from AvailabilitySlot above (GET .../availability/:therapistId),
// which computes bookable slots for a patient rather than returning the
// therapist's own working-hours configuration.
export interface TherapistAvailability {
  timezone: string;
  workingHours: WorkingHoursWindow[];
  timeOff: TherapistTimeOff[];
}

// GET/POST /api/v1/appointments/time-off, DELETE .../time-off/:id - therapist
// only. GET only ever returns future/ongoing blocks.
export interface TherapistTimeOff {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

// GET /api/v1/appointments/patients - therapist only. Only ever contains
// patients the therapist has an actual appointment relationship with
// (backend-enforced) - never render this as if it could list arbitrary
// platform patients.
export interface TherapistPatientSummary {
  patientId: string;
  userName: string | null;
  totalSessions: number;
  lastSessionAt: string | null;
}

// PUT /api/v1/users/therapist-applications/:id - partial update/autosave. Every
// field optional; only keys present in the body are changed. Only allowed while
// status is DRAFT or MORE_INFORMATION_REQUIRED, otherwise 409.
export interface UpdateTherapistApplicationRequest {
  fullName?: string;
  phoneNumber?: string;
  contactEmail?: string;
  professionalBio?: string;
  qualifications?: string[];
  certifications?: string[];
  licenseNumber?: string;
  licenseIssuingBody?: string;
  licenseExpiryDate?: string | null;
  professionalRegistrationNumber?: string | null;
  specialisations?: string[];
  yearsOfExperience?: number;
  languages?: string[];
  availabilitySummary?: string | null;
  location?: string;
  timezone?: string;
}
