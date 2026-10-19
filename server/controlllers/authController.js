// import User from "../models/User.js";
import { User } from "../models/User.js";
import Plan from "../models/Plan.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import Subscription from "../models/Subscription.js";
import Feedback from "../models/Feedback.js";


const registerController = async (req, res) => {
    try {
        const { name, email, password, city, contact } = req.body;

        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const trimmedCity = typeof city === 'string' ? city.trim() : '';
        const trimmedContact = typeof contact === 'string' ? contact.trim() : '';

        if (!trimmedName) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        if (!trimmedEmail) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, message: "Password is required (minimum 8 characters)" });
        }

        if (!trimmedCity) {
            return res.status(400).json({ success: false, message: "City is required" });
        }

        if (!trimmedContact) {
            return res.status(400).json({ success: false, message: "Contact phone is required" });
        }

        const existingUser = await User.findOne({ email: trimmedEmail });

        if (existingUser) {
            return res.status(200).json({
                message: "Email is already registered! Please login",
                success: false
            });
        }

        // create a new user or register new user with default regular role 0
        const hashedPassword = await hashPassword(password);

        const user = await new User({
            name: trimmedName,
            email: trimmedEmail,
            city: trimmedCity,
            contact: trimmedContact,
            password: hashedPassword,
            role: 0
        }).save();

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                city: user.city,
                contact: user.contact,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Error in registration:", error.message);
        res.status(500).json({
            success: false,
            message: "Error in registration. Please try again.",
        });
    }
};

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(404).json({
                success: false,
                message: "invalid email or password",
            });
        }

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "email is not registered",
            })
        }

        const matchPassword = await comparePassword(password, user.password);

        if (!matchPassword) {
            return res.status(200).json({
                success: false,
                message: "Invalid Password"
            });
        }

        // token jwt for successfull login

        const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({
            success: true,
            message: "Login successfully",
            user: {
                name: user.name,
                email: user.email,
                city: user.city,
                contact: user.contact,
                // question:user.question,
                role: user.role,
                _id: user._id,
            },
            token,
        });

    }

    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error in login",
            err
        })
    }

}



// forgotPassword controller
const forgotPasswordController = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!trimmedEmail) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "New Password is required (minimum 8 characters)" });
        }
        
        const user = await User.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email",
                success: false,
            });
        }

        const hashedPassword = await hashPassword(newPassword);

        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.status(200).json({
            message: "Password changed successfully. Please login.",
            success: true,
        });
        
    } catch (error) {
        console.error("Error in forgotPassword:", error.message);
        res.status(500).json({
            message: "Something went wrong in password reset",
            success: false,
        });
    }
};


// update profile

const updateProfileController = async (req, res) => {
    try {
      const { name, email, password, city, contact } = req.body;
      const user = await User.findById(req.user._id);
      //password
      if (password && password.length < 6) {
        return res.json({ error: "Passsword is required and 6 character long" });
      }
      const hashedPassword = password ? await hashPassword(password) : undefined;
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          name: name || user.name,
          password: hashedPassword || user.password,
          contact: contact || user.contact,
          city: city || user.city,
        },
        { new: true }
      );
      res.status(200).send({
        success: true,
        message: "Profile Updated SUccessfully",
        updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        success: false,
        message: "Error WHile Update profile",
        error,
      });
    }
  };




const testController = (req, res) => {
    res.status(200).json({
       message:"routes is required",
       success:true,
   })
   console.log("routes protected");
   }

   
   const userCountController = async (req, res) => {
    try {
        const total = await User.find({}).estimatedDocumentCount();
        res.status(200).json({
            success: true,
            total
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false, error, message: "Error in total User Count",
        })
    }
}

const getAllUsersController = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
            users
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false, error, message: "Error in getting all users",
        })
    }
}



// Route to fetch user's subscription details
const getSubscriptionByUser = async (req, res) => {
    try {
        // Fetch subscription details including connected plan for the authenticated user
        const subscription = await Subscription.findOne({ user: req.user._id }).populate('plan');
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        res.status(200).json({success:true, subscription});
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllSubscriptionByUser = async (req, res) => {
    try {
        // Fetch subscription details including connected plan for the authenticated user
        const subscription = await Subscription.find({ user: req.user._id }).populate('plan');
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        res.status(200).json({success:true, subscription});
    } catch (error) {
        console.error('Error fetching All subscription:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getAllFeedbacksByUser = async (req, res) => {
    try {
        // Fetch subscription details including connected plan for the authenticated user
        const newFeedback = await Feedback.find({ user: req.user._id }).populate('user');
        if (!newFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.status(200).json({success:true, newFeedback});
    } catch (error) {
        console.error('Error fetching All Feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



export { registerController, loginController, forgotPasswordController, testController, updateProfileController, userCountController,getAllUsersController, getSubscriptionByUser, getAllSubscriptionByUser, getAllFeedbacksByUser };