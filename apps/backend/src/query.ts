import { authClient } from "@repo/auth/client";


const response = authClient.signIn.email({
    email: "dpranav7745@gmail.com",
    password: "password@21"
})