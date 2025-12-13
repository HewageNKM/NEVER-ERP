import React, {useEffect, useState} from 'react';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField} from "@mui/material";
import DialogActions from "@mui/material/DialogActions";
import {User} from "@/model";
import {addNewUserAction, updateUserByIdAction} from "@/actions/usersActions";
import {useAppDispatch, useAppSelector} from "@/lib/hooks";
import {getAllUsers} from '@/lib/usersSlice/usersSlice';
import {useSnackbar} from "@/contexts/SnackBarContext";

const UserForm = ({showForm, onClose, user}: { showForm: boolean, onClose: () => void, user: User | null }) => {
    const [isLoading, setIsLoading] = useState(false)
    const {currentUser} = useAppSelector(state => state.authSlice);
    const {showNotification} = useSnackbar();

    const [status, setStatus] = useState(user?.status)
    const [role, setRole] = useState(user?.role)
    const [userName, setUserName] = useState(user?.username)
    const [email, setEmail] = useState(user?.email)
    const [userId, setUserId] = useState(user?.userId)


    const dispatch = useAppDispatch();
    const {selectedSize, selectedPage} = useAppSelector(state => state.usersSlice);
    const handleSubmit = async (evt) => {
        try {
            setIsLoading(true);
            evt.preventDefault()
            const userId: string = evt.target.userId.value.toString();
            const username: string = evt.target.username.value.toString();
            const email: string = evt.target.email.value.toString();
            const status: string = evt.target.status.value.toString();
            const role: string = evt.target.role.value.toString().toUpperCase();
            const usr: User = {
                userId,
                username,
                email,
                status,
                role,
                createdAt: user?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
            if (userId === "Auto Generated") {
                await addNewUserAction(usr);
                showNotification("User created successfully", "success");
            } else {
                console.log(usr)
                await updateUserByIdAction(usr);
                showNotification("User updated successfully", "success");
            }
            setTimeout(() => {
                dispatch(getAllUsers({size: selectedSize, page: selectedPage}));
            }, 2000);
            onClose();
        } catch (e) {
            console.error(e);
            showNotification(e.message, "error");
        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        if (user) {
            setStatus(user.status);
            setRole(user.role);
            setUserName(user.username);
            setEmail(user.email);
            setUserId(user.userId);
        }
    }, [user])
    return (
        <Dialog open={showForm} onClose={onClose} fullWidth>
            <DialogTitle>
                User Form
            </DialogTitle>
            <DialogContent>
                <form
                    onSubmit={handleSubmit}
                >
                    <Stack spacing={2} padding={1} flexDirection={"column"} gap={2}>
                        <FormControl variant="outlined" size="medium">
                            <TextField
                                label={"User ID"}
                                disabled
                                name={"userId"}
                                defaultValue={userId || "Auto Generated"}
                            />
                        </FormControl>
                        <FormControl variant="outlined" size="medium">
                            <TextField
                                required
                                disabled={isLoading}
                                name={"username"}
                                label={"Name"}
                                defaultValue={userName || ""}
                            />
                        </FormControl>
                        <FormControl variant="outlined" size="medium">
                            <TextField
                                required
                                name={"email"}
                                type={"email"}
                                disabled={!!user || isLoading}
                                label={"Email"}
                                defaultValue={email || ""}
                            />
                        </FormControl>
                        <Stack flexDirection={"row"} gap={2} width={"100%"} flexWrap={"wrap"} justifyItems={"start"}>
                            <FormControl variant="outlined" size="medium">
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    disabled={isLoading}
                                    variant={"outlined"}
                                    label={"Status"}
                                    name={"status"}
                                    defaultValue={status || "Inactive"}>
                                    <MenuItem value={"Active"}>Active</MenuItem>
                                    <MenuItem value={"Inactive"}>Inactive</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl variant="outlined" size="medium">
                                <InputLabel id="role-label">Role</InputLabel>
                                <Select
                                    disabled={isLoading}
                                    variant={"outlined"}
                                    name={"role"}
                                    labelId="role-label"
                                    label="Role"
                                    defaultValue={role?.toLowerCase() || "user"}>
                                    <MenuItem value={"admin"}>Admin</MenuItem>
                                    <MenuItem value={"user"}>User</MenuItem>
                                    <MenuItem value={"owner"}
                                              disabled={
                                                  currentUser?.role !== "OWNER"
                                              }
                                    >Owner</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                    <DialogActions>
                        <Button
                            type={"submit"}
                            className={"disabled:bg-opacity-60 disabled:cursor-not-allowed"}
                            variant="contained"
                            disabled={isLoading}
                            color="primary"
                        >
                            {user ? "Update" : "Create"}
                        </Button>
                        <Button
                            type={"button"}
                            className={"disabled:bg-opacity-60 disabled:cursor-not-allowed"}
                            variant="outlined"
                            color="secondary"
                            disabled={isLoading}
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UserForm;