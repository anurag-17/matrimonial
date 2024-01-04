const { mongoose } = require("mongoose");
const UserForm = require("../Model/UserForm");
const uploadOnS3 = require("../Utils/awsS3");
const { updateUser } = require("./UserAuth");
const User = require("../Model/User");

const HttpStatus = {
    OK: 200,
    INVALID: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    SERVER_ERROR: 500,
};
const StatusMessage = {
    INVALID_CREDENTIALS: "Invalid credentials.",
    INVALID_EMAIL_PASSWORD: "Please provide email and password.",
    USER_NOT_FOUND: "User not found.",
    SERVER_ERROR: "Server error.",
    MISSING_DATA: "Please provide all necessary user details.",
    DUPLICATE_DATA: "Data already exists.",
    DUPLICATE_EMAIL: "Email already exists.",
    DUPLICATE_CONTACT: "Contact number already exists.",
    USER_DELETED: "Deleted successfully.",
    UNAUTHORIZED_ACCESS: "Unauthorized access.",
    USER_UPDATED: "User updated successfully.",
    MISSING_PAGE_PARAMS: "Please provide page number and limit.",
    SAVED_SUCC: "Saved Successfully!",
    NOT_FOUND: "Data not found."

};
exports.uploadImage = async (req, res, next) => {
    // console.log(req.file);
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Invalid request" });
        }

        let fileName = req.file.originalname;

        let url = await uploadOnS3(req.file.buffer, fileName); // Assuming req.file.buffer contains the image buffer
        console.log("URL:", url);
        return res.status(200).json({ status: true, url: url });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

};
const changeStepUser = async(id, step) =>{
    try {
        
        if (!id || !step) {
            return null
        }else{
            const UpdateStep = await User.findByIdAndUpdate(id, {step}, { new: true })
            if (!UpdateStep) {
                console.log("error")
            }else{
                console.log("updated step")
            }
        }
    } catch (error) {
        console.log("error",error);
    }

}
exports.addForm = async (req, res) => {
    try {
        const {
            userID, firstname, lastname, address, dateOfBirth, email, education,
            occupation, contactNumber, hobbies, gender, maritalStatus, religion,
            height, income, familyDetails, image
        } = req.body;

        // Check for missing data
        if (!userID || !firstname || !lastname || !address || !dateOfBirth || !email ||
            !education || !contactNumber || !gender || !maritalStatus || !religion ||
            !height || !income || !familyDetails) {
            return res.status(HttpStatus.BAD_REQUEST).json(StatusMessage.MISSING_DATA);
        }

        // Create new user form
        const newUserForm = new UserForm({
            userID, firstname, lastname, address, dateOfBirth, email, education,
            occupation, contactNumber, hobbies, gender, maritalStatus, religion,
            height, income, familyDetails, image
        });

        // Save to database
        const result = await newUserForm.save();
        console.log(result); // For debugging

        // Return success response
        return res.status(HttpStatus.OK).json(result);

    } catch (error) {
        console.error(error); // For debugging
        // Handle specific errors
        // General server error
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(StatusMessage.SERVER_ERROR);
    }
};


exports.editFormById = async (req, res) => {
    try {
        const formId = req.params.id;

        // Validate if id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(HttpStatus.BAD_REQUEST).json(StatusMessage.NOT_FOUND);
        }

        // Build update object dynamically
        const updateData = {};
        const fields = ['firstname', 'lastname', 'address', 'dateOfBirth', 'email', 'education',
            'occupation', 'contactNumber', 'hobbies', 'gender', 'maritalStatus',
            'religion', 'height', 'income', 'familyDetails', 'image', 'video'];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Update the form
        const updatedForm = await UserForm.findByIdAndUpdate(
            formId,
            updateData,
            { new: true } // Return the updated document
        );

        // Check if update was successful
        if (!updatedForm) {
            return res.status(HttpStatus.INVALID).json(StatusMessage.NOT_FOUND);
        }

        // Return success response with updated form
        return res.status(HttpStatus.OK).json(updatedForm);

    } catch (error) {
        console.error(error);
        return res.status(HttpStatus.SERVER_ERROR).json(StatusMessage.SERVER_ERROR);
    }
};

exports.deleteFormById = async (req, res) => {
    try {
        const formId = req.params.id; // Assuming you pass the _id as a URL parameter

        // Validate if id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(HttpStatus.BAD_REQUEST).json(StatusMessage.NOT_FOUND);
        }

        // Delete the form
        const deletedForm = await UserForm.findByIdAndDelete(formId);

        // Check if deletion was successful
        if (!deletedForm) {
            return res.status(HttpStatus.INVALID).json(StatusMessage.NOT_FOUND);
        }

        // Return success response
        return res.status(HttpStatus.OK).json("Deleted Successfully.");

    } catch (error) {
        console.error(error); // For debugging
        return res.status(HttpStatus.SERVER_ERROR).json(StatusMessage.SERVER_ERROR);
    }
};
exports.getFormById = async (req, res) => {
    try {
        const formId = req.params.id; // Assuming _id is passed as a URL parameter

        // Validate if id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: StatusMessage.INVALID_ID });
        }

        // Find the form by its _id
        const form = await UserForm.findById(formId);

        // Check if the form was found
        if (!form) {
            return res.status(HttpStatus.INVALID).json({ message: StatusMessage.NOT_FOUND });
        }

        // Return the found form
        return res.status(HttpStatus.OK).json(form);

    } catch (error) {
        console.error(error); // For debugging purposes
        return res.status(HttpStatus.SERVER_ERROR).json({ message: StatusMessage.SERVER_ERROR });
    }
};

exports.changeStatusForm = async (req, res) => {
    try {
        const formId = req.params.id; // Assuming _id is passed as a URL parameter
        const { formStatus } = req.body

        // Validate if id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: StatusMessage.MISSING_DATA });
        }
        if (!formStatus) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: StatusMessage.MISSING_DATA });
        }


        // Find the form by its _id
        const updatedForm = await UserForm.findByIdAndUpdate(
            formId,
            { formStatus },
            { new: true } // Return the updated document
        );

        // Check if update was successful
        if (!updatedForm) {
            return res.status(HttpStatus.INVALID).json(StatusMessage.NOT_FOUND);
        }

        // Return success response with updated form
        if (formStatus?.toLowerCase() === "pending" || formStatus?.toLowerCase() === "rejected") {
          
            changeStepUser(updatedForm.userID, 1)

            
        } else {
            changeStepUser(updatedForm.userID, 2)

           
        }
        return res.status(HttpStatus.OK).json(updatedForm);

    } catch (error) {
        console.error(error); // For debugging purposes
        return res.status(HttpStatus.SERVER_ERROR).json({ message: StatusMessage.SERVER_ERROR });
    }
};

exports.viewForm = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const search = req.query.search || "";
        const gender = req.query.gender;

        if (!page || !limit) {
            return res.status(HttpStatus.BAD_REQUEST).json(StatusMessage.MISSING_PAGE_PARAMS);
        }

        const startIndex = (page - 1) * limit;

        // Build the query based on search and gender
        let query = {};
        let searchQuery = {};
        let genderQuery = {};

        // Search query
        if (search) {
            searchQuery = {
                $or: [
                    { firstname: { $regex: search, $options: 'i' } },
                    { contactNumber: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Gender query
        if (gender) {
            genderQuery = { gender: { $regex: `^${gender}$`, $options: 'i' } };
        }

        // Combine queries
        if (search && gender) {
            query = { $and: [searchQuery, genderQuery] };
        } else if (search || gender) {
            query = search ? searchQuery : genderQuery;
        }

        const userForm = await UserForm.find(query).skip(startIndex).limit(limit);
        const totalUsers = await UserForm.countDocuments(query);

        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers: totalUsers
        };

        return res.status(HttpStatus.OK).json({ userForm, pagination });
    } catch (error) {
        console.error(error);
        return res.status(HttpStatus.BAD_REQUEST).json("Error fetching users.");
    }
};
exports.getFormByUserID = async(req,res)=>{
    const {userID} = req.body
    if (!userID) {
        return res.status(HttpStatus.BAD_REQUEST).json(StatusMessage.MISSING_DATA);
    }
    try {
       const form = await UserForm.find({userID}) 
       if (!form) {
        return res.status(HttpStatus.INVALID).json({ message: StatusMessage.NOT_FOUND });
    }

    // Return the found form
    return res.status(HttpStatus.OK).json(form);
    } catch (error) {
        console.error(error); // For debugging purposes
        return res.status(HttpStatus.SERVER_ERROR).json({ message: StatusMessage.SERVER_ERROR });
    }
}

