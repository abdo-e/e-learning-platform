const Company = require('../models/company.model');
const User = require('../models/user.model');
const Course = require('../models/course.model');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Create a new company (request registration)
 */
exports.createCompany = async (req, res) => {
    try {
        const {
            name,
            industry,
            size,
            website,
            description,
            contactPerson,
            billingAddress,
            taxId
        } = req.body;

        // Check if company already exists
        const existingCompany = await Company.findOne({ name });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'A company with this name already exists'
            });
        }

        const company = new Company({
            name,
            industry,
            size,
            website,
            description,
            contactPerson,
            billingAddress,
            taxId,
            registrationStatus: 'pending'
        });

        await company.save();

        res.status(201).json({
            success: true,
            message: 'Company registration request submitted. Awaiting admin approval.',
            data: company
        });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating company',
            error: error.message
        });
    }
};

/**
 * Approve company registration (Admin only)
 */
exports.approveCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const adminId = req.user._id;

        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        if (company.registrationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Company registration is not pending'
            });
        }

        await company.approve(adminId);

        res.status(200).json({
            success: true,
            message: 'Company approved successfully',
            data: company
        });
    } catch (error) {
        console.error('Approve company error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving company',
            error: error.message
        });
    }
};

/**
 * Reject company registration (Admin only)
 */
exports.rejectCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { reason } = req.body;

        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        await company.reject(reason);

        res.status(200).json({
            success: true,
            message: 'Company registration rejected',
            data: company
        });
    } catch (error) {
        console.error('Reject company error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting company',
            error: error.message
        });
    }
};

/**
 * Get company dashboard
 */
exports.getCompanyDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find company where user is an admin
        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        })
            .populate('employees.userId', 'name email courseProgress')
            .populate('mandatoryCourses.courseId', 'title description difficulty');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'No company found or access denied'
            });
        }

        // Update company statistics
        await company.updateStats();

        // Get employee progress summary
        const employeeProgress = company.employees
            .filter(e => e.isActive)
            .map(emp => {
                const user = emp.userId;
                const completedCourses = user.courseProgress.filter(cp => cp.completed).length;
                const totalCourses = user.courseProgress.length;
                const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

                return {
                    employeeId: emp.employeeId,
                    name: user.name,
                    email: user.email,
                    department: emp.department,
                    position: emp.position,
                    completedCourses,
                    totalCourses,
                    completionRate: Math.round(completionRate)
                };
            });

        res.status(200).json({
            success: true,
            data: {
                company: {
                    id: company._id,
                    name: company.name,
                    stats: company.stats
                },
                employeeProgress,
                mandatoryCourses: company.mandatoryCourses
            }
        });
    } catch (error) {
        console.error('Get company dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company dashboard',
            error: error.message
        });
    }
};

/**
 * Add employee to company
 */
exports.addEmployee = async (req, res) => {
    try {
        const { email, employeeId, department, position } = req.body;
        const userId = req.user._id;

        // Find company where user is an admin
        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found or access denied'
            });
        }

        // Find user by email
        const employee = await User.findOne({ email });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        // Check if employee already exists
        const existingEmployee = company.employees.find(
            e => e.userId.toString() === employee._id.toString()
        );

        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Employee already exists in this company'
            });
        }

        // Add employee
        await company.addEmployee(employee._id, { employeeId, department, position });

        // Update user's company reference
        employee.company = company._id;
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Employee added successfully',
            data: company
        });
    } catch (error) {
        console.error('Add employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding employee',
            error: error.message
        });
    }
};

/**
 * Remove employee from company
 */
exports.removeEmployee = async (req, res) => {
    try {
        const { employeeUserId } = req.params;
        const userId = req.user._id;

        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found or access denied'
            });
        }

        await company.removeEmployee(employeeUserId);

        // Update user's company reference
        const employee = await User.findById(employeeUserId);
        if (employee) {
            employee.company = null;
            await employee.save();
        }

        res.status(200).json({
            success: true,
            message: 'Employee removed successfully',
            data: company
        });
    } catch (error) {
        console.error('Remove employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing employee',
            error: error.message
        });
    }
};

/**
 * Assign mandatory course
 */
exports.assignCourse = async (req, res) => {
    try {
        const { courseId, deadline, applicableTo, departments, specificEmployees } = req.body;
        const userId = req.user._id;

        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found or access denied'
            });
        }

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        await company.assignCourse(courseId, userId, {
            deadline,
            applicableTo,
            departments,
            specificEmployees
        });

        res.status(200).json({
            success: true,
            message: 'Course assigned successfully',
            data: company
        });
    } catch (error) {
        console.error('Assign course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning course',
            error: error.message
        });
    }
};

/**
 * Track employee progress
 */
exports.trackEmployeeProgress = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const userId = req.user._id;

        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found or access denied'
            });
        }

        const employee = await User.findById(employeeId)
            .populate('courseProgress.courseId', 'title description')
            .populate('enrolledCourses.courseId', 'title');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check if employee belongs to this company
        const isEmployee = company.employees.some(
            e => e.userId.toString() === employeeId && e.isActive
        );

        if (!isEmployee) {
            return res.status(403).json({
                success: false,
                message: 'Employee does not belong to this company'
            });
        }

        // Get mandatory courses for this employee
        const mandatoryCourses = company.mandatoryCourses.filter(mc =>
            company.isMandatoryCourse(mc.courseId, employeeId)
        );

        // Check completion status of mandatory courses
        const mandatoryProgress = mandatoryCourses.map(mc => {
            const progress = employee.courseProgress.find(
                cp => cp.courseId._id.toString() === mc.courseId.toString()
            );

            return {
                course: mc.courseId,
                deadline: mc.deadline,
                completed: progress ? progress.completed : false,
                completedAt: progress ? progress.completedAt : null
            };
        });

        res.status(200).json({
            success: true,
            data: {
                employee: {
                    id: employee._id,
                    name: employee.name,
                    email: employee.email
                },
                allProgress: employee.courseProgress,
                mandatoryProgress,
                stats: {
                    totalCourses: employee.courseProgress.length,
                    completedCourses: employee.courseProgress.filter(cp => cp.completed).length,
                    mandatoryCompleted: mandatoryProgress.filter(mp => mp.completed).length,
                    mandatoryTotal: mandatoryProgress.length
                }
            }
        });
    } catch (error) {
        console.error('Track employee progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking employee progress',
            error: error.message
        });
    }
};

/**
 * Generate compliance report
 */
exports.generateComplianceReport = async (req, res) => {
    try {
        const { format = 'pdf' } = req.query;
        const userId = req.user._id;

        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        })
            .populate('employees.userId', 'name email courseProgress')
            .populate('mandatoryCourses.courseId', 'title');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found or access denied'
            });
        }

        if (format === 'pdf') {
            // Generate PDF report and stream directly to response
            const doc = new PDFDocument();
            const filename = `compliance-report-${company.name}-${Date.now()}.pdf`;

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Pipe PDF directly to response
            doc.pipe(res);

            // Add content to PDF
            doc.fontSize(20).text('Training Compliance Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Company: ${company.name}`);
            doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
            doc.moveDown();

            doc.fontSize(16).text('Summary');
            doc.fontSize(12).text(`Total Employees: ${company.stats.totalEmployees}`);
            doc.text(`Active Employees: ${company.stats.activeEmployees}`);
            doc.text(`Total Courses Completed: ${company.stats.totalCoursesCompleted}`);
            doc.text(`Average Completion Rate: ${company.stats.averageCompletionRate}%`);
            doc.moveDown();

            doc.fontSize(16).text('Employee Details');
            doc.moveDown();

            company.employees.filter(e => e.isActive).forEach(emp => {
                const user = emp.userId;
                const completed = user.courseProgress.filter(cp => cp.completed).length;
                const total = user.courseProgress.length;

                doc.fontSize(12).text(`${user.name} (${emp.department || 'N/A'})`);
                doc.fontSize(10).text(`  Email: ${user.email}`);
                doc.text(`  Completed: ${completed}/${total} courses`);
                doc.moveDown(0.5);
            });

            // Finalize PDF
            doc.end();
        } else if (format === 'csv') {
            // Generate CSV report
            let csv = 'Name,Email,Department,Position,Completed Courses,Total Courses,Completion Rate\n';

            company.employees.filter(e => e.isActive).forEach(emp => {
                const user = emp.userId;
                const completed = user.courseProgress.filter(cp => cp.completed).length;
                const total = user.courseProgress.length;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                csv += `"${user.name}","${user.email}","${emp.department || 'N/A'}","${emp.position || 'N/A'}",${completed},${total},${rate}%\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=compliance-report-${company.name}-${Date.now()}.csv`);
            res.send(csv);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid format. Use "pdf" or "csv"'
            });
        }
    } catch (error) {
        console.error('Generate compliance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating compliance report',
            error: error.message
        });
    }
};

/**
 * Get training analytics
 */
exports.getTrainingAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        })
            .populate('employees.userId', 'name courseProgress')
            .populate('mandatoryCourses.courseId', 'title category');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found or access denied'
            });
        }

        // Calculate analytics
        const activeEmployees = company.employees.filter(e => e.isActive);

        // Completion rates by department
        const departmentStats = {};
        activeEmployees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            if (!departmentStats[dept]) {
                departmentStats[dept] = { total: 0, completed: 0, employees: 0 };
            }

            const user = emp.userId;
            const completed = user.courseProgress.filter(cp => cp.completed).length;
            const total = user.courseProgress.length;

            departmentStats[dept].employees++;
            departmentStats[dept].completed += completed;
            departmentStats[dept].total += total;
        });

        // Course completion trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyCompletions = {};
        activeEmployees.forEach(emp => {
            emp.userId.courseProgress
                .filter(cp => cp.completed && cp.completedAt >= sixMonthsAgo)
                .forEach(cp => {
                    const month = new Date(cp.completedAt).toISOString().slice(0, 7);
                    monthlyCompletions[month] = (monthlyCompletions[month] || 0) + 1;
                });
        });

        res.status(200).json({
            success: true,
            data: {
                overview: company.stats,
                departmentStats,
                monthlyCompletions,
                mandatoryCourses: company.mandatoryCourses.length
            }
        });
    } catch (error) {
        console.error('Get training analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching training analytics',
            error: error.message
        });
    }
};

/**
 * Get all companies (Admin only)
 */
exports.getAllCompanies = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = {};
        if (status) query.registrationStatus = status;

        const companies = await Company.find(query)
            .select('name industry size registrationStatus contactPerson stats createdAt')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Company.countDocuments(query);

        res.status(200).json({
            success: true,
            data: companies,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching companies',
            error: error.message
        });
    }
};
