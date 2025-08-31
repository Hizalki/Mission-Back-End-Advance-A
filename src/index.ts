import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 5000;
const prisma = new PrismaClient();

app.use(express.json());

interface UserData {
    id: string;
    fullname: string;
    username: string;
    email: string;
}

interface ValidationRequest extends express.Request {
    userData: UserData;
}

const accessValidation = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ValidationRequest = req as ValidationRequest;
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ message: 'butuh token uy' });
    }

    const tokenn = authorization?.split(' ')[1];
    if (!tokenn) {
        return res.status(401).json({ message: 'butuh token uy' });
    }

    const secret = process.env.JWT_SECRET!;
    try {
        const jwtDecoded = jwt.verify(tokenn, secret) as UserData;
        ValidationRequest.userData = jwtDecoded;
    } catch (err) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    next();
};

// REGISTER
app.use('/register', async (req, res) => {
    const { fullname, username, password, email } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await prisma.users.create({
        data: {
            fullname: fullname,
            username: username,
            password: hashedPassword, // hase password
            email: email
        }
    })
    res.json({
        data: result,
        message: 'User created successfully'
    })
});

// LOGIN
app.use('/log', async (req, res) => {
    const { password, email} = req.body;

    const user = await prisma.users.findUnique({
        where: { email: email }
    })

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if(!user.password) {
        return res.status(401).json({ message: 'Password not set' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(isPasswordValid){

        const payload = {
            id: user.id,
            fullname: user.fullname,
            username: user.username,
            email: user.email
        }

        const secret = process.env.JWT_SECRET!;

        const expiresIn = 60 * 60 * 1;

        const token = jwt.sign(payload, secret, {expiresIn: expiresIn});

        return res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email
            },
            token: token
        });
    } else {
        return res.status(401).json({ message: 'Invalid password' });
    }

});

// READ
app.get('/users', accessValidation, async (req, res, next) => {
    const users = await prisma.users.findMany();
    res.json({
        data: users,
        message: 'User list retrieved successfully'
    })
});

// UPDATE
app.patch('/users/:id', async (req, res, next) => {
    const { id } = req.params;
    const { fullname, username, password, email } = req.body;
    const result = await prisma.users.update({
        where: { id: Number(id) },
        data: {
            fullname: fullname,
            username: username,
            password: password,
            email: email
        }
    })
    res.json({
        data: result,
        message: `User ${id} successfully updated`
    })
});

// DELETE
app.delete('/users/:id', async (req, res, next) => {
    const { id } = req.params;
    await prisma.users.delete({
        where: { id: Number(id) }
    })
    res.json({
        message: `User ${id} successfully deleted`
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});