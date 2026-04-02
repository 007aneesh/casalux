/**
 * Admin router — restricted to admin/super_admin roles.
 *
 * Dashboard:
 *   GET  /api/v1/admin/stats                                   — aggregate counts
 *
 * Listings:
 *   GET   /api/v1/admin/listings                               — all listings paginated
 *   PATCH /api/v1/admin/listings/:id/status                    — change listing status
 *
 * Bookings:
 *   GET  /api/v1/admin/bookings                                — all bookings paginated
 *
 * Users:
 *   GET  /api/v1/admin/users                                   — all users paginated
 *
 * Host applications:
 *   GET  /api/v1/admin/host-applications                       — list submitted applications
 *   POST /api/v1/admin/host-applications/:sessionId/approve    — approve application
 *   POST /api/v1/admin/host-applications/:sessionId/reject     — reject application with reason
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '@casalux/auth'
import { OnboardingService }    from '../services/onboarding.service.js'
import { OnboardingController } from '../controllers/onboarding.controller.js'
import { AdminController }      from '../controllers/admin.controller.js'
import { queueService } from '../container.js'

const onboardingService    = new OnboardingService(queueService)
const onboardingController = new OnboardingController(onboardingService)
const adminController      = new AdminController()

export const adminRouter = new Hono()

// All admin routes require auth + admin role
adminRouter.use('*', requireAuth(), requireRole('admin'))

// ─── Dashboard stats ──────────────────────────────────────────────────────────
adminRouter.get('/stats', (c) => adminController.getStats(c))

// ─── Listings ─────────────────────────────────────────────────────────────────
adminRouter.get(  '/listings',                      (c) => adminController.getListings(c))
adminRouter.patch('/listings/:id/status',           (c) => adminController.updateListingStatus(c))
adminRouter.post( '/listings/:id/amenities',        (c) => adminController.addCustomAmenity(c))

// ─── Bookings ─────────────────────────────────────────────────────────────────
adminRouter.get(   '/bookings',              (c) => adminController.getBookings(c))
adminRouter.get(   '/bookings/:id',          (c) => adminController.getBookingDetail(c))
adminRouter.patch( '/bookings/:id/cancel',   (c) => adminController.cancelBooking(c))
adminRouter.patch( '/bookings/:id/refund',   (c) => adminController.overrideRefund(c))
adminRouter.patch( '/bookings/:id/payout',   (c) => adminController.overridePayout(c))
adminRouter.patch( '/bookings/:id/dispute',  (c) => adminController.setDispute(c))

// ─── Users ───────────────────────────────────────────────────────────────────
adminRouter.get(   '/users',                    (c) => adminController.getUsers(c))
adminRouter.get(   '/users/:id',                (c) => adminController.getUserDetail(c))
adminRouter.patch( '/users/:id/ban',            (c) => adminController.banUser(c))
adminRouter.patch( '/users/:id/unban',          (c) => adminController.unbanUser(c))
adminRouter.patch( '/users/:id/verify',         (c) => adminController.setVerification(c))
adminRouter.patch( '/users/:id/role',           (c) => adminController.changeRole(c))
adminRouter.patch( '/users/:id/superhost',      (c) => adminController.toggleSuperhost(c))
adminRouter.delete('/users/:id',                (c) => adminController.deleteUser(c))

// ─── Host application review ─────────────────────────────────────────────────
adminRouter.get( '/host-applications',                    (c) => onboardingController.listApplications(c))
adminRouter.post('/host-applications/:sessionId/approve', (c) => onboardingController.approve(c))
adminRouter.post('/host-applications/:sessionId/reject',  (c) => onboardingController.reject(c))

// ─── Audit logs ───────────────────────────────────────────────────────────────
adminRouter.get('/audit-logs', (c) => adminController.getAuditLogs(c))
