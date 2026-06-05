export type Role = 'Student' | 'Driver' | 'Admin';

export interface DecodedUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  userId: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  university: string;
  phoneNumber?: string | null;
  role: Role;
  rating: number;
  isVerified: boolean;
  verificationRequestedAt?: string | null;
}

export interface AdminUser extends UserProfile {
  isSuspended: boolean;
}

export interface AdminStats {
  users: number;
  activeUsers: number;
  suspendedUsers: number;
  rides: number;
  reservations: number;
  messages: number;
  reviews: number;
  notifications: number;
}

export type RideStatus = 'Open' | 'Full' | 'Completed' | 'Cancelled' | 'InProgress';
export type ReservationStatusValue = 0 | 1 | 2; // Pending=0, Confirmed=1, Cancelled=2

export interface Ride {
  rideId: number;
  driverId: number;
  driverName: string;
  startLocation: string;
  destination: string;
  departureTime: string;
  expectedArrivalTime: string;
  availableSeats: number;
  price: number;
  university: string;
  distanceKm: number;
  status: RideStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  isRecurring: boolean;
  recurrenceGroupId?: string | null;
  recurrenceIndex?: number | null;
}

export interface RideCreatePayload {
  startLocation: string;
  destination: string;
  departureTime: string;
  expectedArrivalTime: string;
  availableSeats: number;
  price: number;
  university: string;
  distanceKm: number;
  isRecurring?: boolean;
  recurrenceCount?: number;
  recurrenceIntervalDays?: number;
}

export type ReportStatus = 'Open' | 'Resolved' | 'Dismissed';

export interface Report {
  reportId: number;
  reporterId: number;
  reporterName: string;
  targetUserId?: number | null;
  targetUserName?: string | null;
  rideId?: number | null;
  rideRoute?: string | null;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface Reservation {
  reservationId: number;
  rideId: number;
  passengerId: number;
  passengerName: string;
  driverId: number;
  driverName: string;
  startLocation: string;
  destination: string;
  departureTime?: string;
  reservationStatus: ReservationStatusValue;
  createdAt: string;
}

export interface ChatMessage {
  chatMessageId: number;
  rideId: number;
  senderId: number;
  receiverId: number;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export interface ChatThread {
  rideId: number;
  otherUserId: number;
  otherUserName: string;
  route: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface RideSearchParams {
  university?: string;
  location?: string;
  departureFrom?: string;
  departureTo?: string;
  minSeats?: number;
  sortBy?: 'departure' | 'price' | 'distance';
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
  errorCode?: string;
  traceId?: string;
}
