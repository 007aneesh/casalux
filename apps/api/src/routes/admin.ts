/**
 * Admin router — restricted to admin/super_admin roles.
 * PRD Section 12 (host applications), Section 14 (platform admin).
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
import { queueService } from '../container.js'

const onboardingService    = new OnboardingService(queueService)
const onboardingController = new OnboardingController(onboardingService)

export const adminRouter = new Hono()

// All admin routes require auth + admin role
adminRouter.use('*', requireAuth(), requireRole('admin'))

// ─── Host application review ─────────────────────────────────────────────────
adminRouter.get( '/host-applications',                    (c) => onboardingController.listApplications(c))
adminRouter.post('/host-applications/:sessionId/approve', (c) => onboardingController.approve(c))
adminRouter.post('/host-applications/:sessionId/reject',  (c) => onboardingController.reject(c))
