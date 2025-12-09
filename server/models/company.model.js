const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Registration status
    registrationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    registrationRequestedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: {
        type: String
    },
    // Company information
    industry: {
        type: String,
        trim: true
    },
    size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    website: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Contact information
    contactPerson: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        phone: {
            type: String
        },
        position: {
            type: String
        }
    },
    // Billing information
    billingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    taxId: {
        type: String,
        trim: true
    },
    // Corporate admins
    admins: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Employees
    employees: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        employeeId: {
            type: String,
            trim: true
        },
        department: {
            type: String,
            trim: true
        },
        position: {
            type: String,
            trim: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    // Course assignments
    mandatoryCourses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        deadline: {
            type: Date
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        // Which employees this applies to
        applicableTo: {
            type: String,
            enum: ['all', 'department', 'specific'],
            default: 'all'
        },
        departments: [String], // If applicableTo is 'department'
        specificEmployees: [{ // If applicableTo is 'specific'
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    // Subscription/License
    subscriptionType: {
        type: String,
        enum: ['per_user', 'unlimited', 'custom'],
        default: 'per_user'
    },
    maxUsers: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'suspended', 'cancelled'],
        default: 'active'
    },
    subscriptionStartDate: {
        type: Date
    },
    subscriptionEndDate: {
        type: Date
    },
    // Settings
    settings: {
        requireCourseCompletion: {
            type: Boolean,
            default: true
        },
        sendProgressReports: {
            type: Boolean,
            default: true
        },
        reportFrequency: {
            type: String,
            enum: ['weekly', 'monthly', 'quarterly'],
            default: 'monthly'
        },
        allowSelfEnrollment: {
            type: Boolean,
            default: false
        }
    },
    // Statistics
    stats: {
        totalEmployees: {
            type: Number,
            default: 0
        },
        activeEmployees: {
            type: Number,
            default: 0
        },
        totalCoursesCompleted: {
            type: Number,
            default: 0
        },
        averageCompletionRate: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes
companySchema.index({ name: 1 });
companySchema.index({ registrationStatus: 1 });
companySchema.index({ 'contactPerson.email': 1 });
companySchema.index({ 'employees.userId': 1 });

// Virtual for checking if company is approved
companySchema.virtual('isApproved').get(function () {
    return this.registrationStatus === 'approved';
});

// Method to approve company registration
companySchema.methods.approve = function (adminId) {
    this.registrationStatus = 'approved';
    this.approvedAt = new Date();
    this.approvedBy = adminId;
    return this.save();
};

// Method to reject company registration
companySchema.methods.reject = function (reason) {
    this.registrationStatus = 'rejected';
    this.rejectionReason = reason;
    return this.save();
};

// Method to add employee
companySchema.methods.addEmployee = function (userId, employeeData = {}) {
    this.employees.push({
        userId,
        employeeId: employeeData.employeeId,
        department: employeeData.department,
        position: employeeData.position
    });
    this.stats.totalEmployees = this.employees.length;
    this.stats.activeEmployees = this.employees.filter(e => e.isActive).length;
    return this.save();
};

// Method to remove employee
companySchema.methods.removeEmployee = function (userId) {
    const employee = this.employees.find(e => e.userId.toString() === userId.toString());
    if (employee) {
        employee.isActive = false;
    }
    this.stats.activeEmployees = this.employees.filter(e => e.isActive).length;
    return this.save();
};

// Method to assign mandatory course
companySchema.methods.assignCourse = function (courseId, assignedBy, options = {}) {
    this.mandatoryCourses.push({
        courseId,
        assignedBy,
        deadline: options.deadline,
        applicableTo: options.applicableTo || 'all',
        departments: options.departments || [],
        specificEmployees: options.specificEmployees || []
    });
    return this.save();
};

// Method to check if course is mandatory for employee
companySchema.methods.isMandatoryCourse = function (courseId, userId) {
    return this.mandatoryCourses.some(mc => {
        if (mc.courseId.toString() !== courseId.toString()) return false;

        if (mc.applicableTo === 'all') return true;

        if (mc.applicableTo === 'specific') {
            return mc.specificEmployees.some(empId => empId.toString() === userId.toString());
        }

        if (mc.applicableTo === 'department') {
            const employee = this.employees.find(e => e.userId.toString() === userId.toString());
            return employee && mc.departments.includes(employee.department);
        }

        return false;
    });
};

// Method to update statistics
companySchema.methods.updateStats = async function () {
    const User = mongoose.model('User');

    const employeeIds = this.employees.filter(e => e.isActive).map(e => e.userId);
    const employees = await User.find({ _id: { $in: employeeIds } });

    let totalCompleted = 0;
    let totalProgress = 0;

    employees.forEach(emp => {
        totalCompleted += emp.courseProgress.filter(cp => cp.completed).length;
        totalProgress += emp.courseProgress.length;
    });

    this.stats.totalCoursesCompleted = totalCompleted;
    this.stats.averageCompletionRate = totalProgress > 0
        ? Math.round((totalCompleted / totalProgress) * 100)
        : 0;

    return this.save();
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
