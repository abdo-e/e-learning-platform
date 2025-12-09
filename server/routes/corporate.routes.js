const express = require('express');
const router = express.Router();
const corporateController = require('../controllers/corporate.controller');
const { protect } = require('../middleware/auth');
const { requireCorporateAdmin } = require('../middleware/role.middleware');

// Create company (request registration) - protected
router.post('/companies', protect, corporateController.createCompany);

// Get company dashboard (protected, corporate admin only)
router.get('/dashboard', protect, requireCorporateAdmin, corporateController.getCompanyDashboard);

// Employee management (protected, corporate admin only)
router.post('/employees', protect, requireCorporateAdmin, corporateController.addEmployee);
router.delete('/employees/:employeeUserId', protect, requireCorporateAdmin, corporateController.removeEmployee);

// Course assignment (protected, corporate admin only)
router.post('/assign-course', protect, requireCorporateAdmin, corporateController.assignCourse);

// Track employee progress (protected, corporate admin only)
router.get('/employee-progress/:employeeId', protect, requireCorporateAdmin, corporateController.trackEmployeeProgress);

// Generate compliance report (protected, corporate admin only)
router.get('/compliance-report', protect, requireCorporateAdmin, corporateController.generateComplianceReport);

// Get training analytics (protected, corporate admin only)
router.get('/analytics', protect, requireCorporateAdmin, corporateController.getTrainingAnalytics);

// Admin routes (protected)
router.post('/companies/:companyId/approve', protect, corporateController.approveCompany); // TODO: Add admin middleware
router.post('/companies/:companyId/reject', protect, corporateController.rejectCompany); // TODO: Add admin middleware
router.get('/companies/all', protect, corporateController.getAllCompanies); // TODO: Add admin middleware

module.exports = router;
