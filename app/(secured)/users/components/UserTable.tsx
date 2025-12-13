"use client";
import React, {useEffect, useState} from 'react';
import {
    Box,
    IconButton,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import {IoAdd, IoPencil, IoRefreshCircle, IoRefreshOutline, IoTrash} from "react-icons/io5";
import EmptyState from "@/app/components/EmptyState";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import {useAppDispatch, useAppSelector} from "@/lib/hooks";
import {User} from "@/model";
import {getAllUsers, setSelectedPage, setSelectedSize, setSelectedUser} from '@/lib/usersSlice/usersSlice';
import UserForm from "@/app/(secured)/users/components/UserForm";
import {deleteUserByIdAction} from "@/actions/usersActions";
import {useSnackbar} from "@/contexts/SnackBarContext";
import {useConfirmationDialog} from "@/contexts/ConfirmationDialogContext";

const UserTable = () => {
    const {
        users,
        loading,
        selectedPage,
        selectedSize,
        selectedRole,
        selectedStatus,
        selectedUser
    } = useAppSelector(state => state.usersSlice);
    const {currentUser} = useAppSelector(state => state.authSlice);
    const [showUserForm, setShowUserForm] = useState(false)
    const dispatch = useAppDispatch();
    const {showNotification} = useSnackbar();
    const {showConfirmation} = useConfirmationDialog();

    useEffect(() => {
        if (currentUser) {
            dispatch(getAllUsers({size: selectedSize, page: selectedPage}));
        }
    }, [currentUser, selectedSize, selectedPage, selectedRole, selectedStatus]);

    const onDelete = async (userId: string) => {
        showConfirmation({
            title: "Delete User",
            message: "Deleting an user has serious consequences. Are you sure you want to delete this user?",
            onSuccess: async () => {
                try {
                    await deleteUserByIdAction(userId);
                    await deleteUserByIdAction(userId);
                    setTimeout(() => {
                        dispatch(getAllUsers({size: selectedSize, page: selectedPage}));
                    }, 2000);
                } catch (e) {
                    console.error(e);
                    showNotification(e.message, "error");
                }
            }
        });
    }
    const onEdit = (user:User) => {
        showConfirmation({
            title: "Edit User",
            message: "Editing an user has serious consequences. Are you sure you want to edit this user?",
            onSuccess: async () => {
                dispatch(setSelectedUser(user))
                setShowUserForm(true)
            }
        })
    }
    return (
        <Stack direction={"column"} gap={5}>
            <TableContainer component={Paper} sx={{
                position: "relative",
                borderRadius: 2,
                boxShadow: 2,
                overflow: "hidden"
            }}>
                <Box flexDirection={"row"} display={"flex"} justifyContent={"space-between"} alignItems={"center"}>
                    <Box
                        display={"flex"}
                        flexDirection={"row"}
                        alignItems={"center"}
                    >
                        <Typography variant="h6" component="div" sx={{padding: 2}}>
                            Users
                        </Typography>
                        <IconButton color={"primary"} onClick={() => dispatch(getAllUsers({page: selectedPage, size: selectedSize}))}>
                            <IoRefreshOutline />
                        </IconButton>
                    </Box>
                    <IconButton
                        onClick={() => setShowUserForm(true)}
                        color={"primary"}
                    >
                        <IoAdd size={25}/>
                    </IconButton>
                </Box>
                <Table
                    sx={{
                        minWidth: 650,
                        "& thead": {
                            backgroundColor: "#f5f5f5",
                            "& th": {
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                fontSize: "0.875rem"
                            }
                        },
                        "& tbody tr:nth-of-type(odd)": {
                            backgroundColor: "#fafafa"
                        },
                        "& tbody tr:hover": {
                            backgroundColor: "#f0f0f0"
                        }
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>User ID</TableCell>
                            <TableCell>User Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Updated At</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user: User) => (
                            <TableRow key={user.userId}>
                                <TableCell>{user.userId}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.status}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.createdAt}</TableCell>
                                <TableCell>{user.updatedAt}</TableCell>
                                <TableCell>
                                    <Box flexDirection={"row"} display={"flex"} gap={1}>
                                        <IconButton
                                            disabled={currentUser?.role != "OWNER" && user.role == "OWNER"}
                                            onClick={() => onEdit(user)}
                                            color={"primary"}
                                        >
                                            <IoPencil size={25}/>
                                        </IconButton>
                                        <IconButton color={"error"}
                                                    disabled={(currentUser?.userId === user.userId) || (currentUser?.role != "OWNER" && user.role == "OWNER")}
                                                    onClick={() => onDelete(user.userId)}
                                        >
                                            <IoTrash size={25}/>
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {(users.length === 0 && !loading) && (
                    <EmptyState
                        title={"No users"}
                        subtitle={"No users available."}
                    />
                )}
                {loading && (
                    <ComponentsLoader position={"absolute"} title={"Loading Users"}/>
                )}
            </TableContainer>
            <Box
                mt={2}
                gap={1}
                display="flex"
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
            >
                <Select variant="outlined" size="small" defaultValue={selectedSize}
                        onChange={(event) => dispatch(setSelectedSize(Number.parseInt(event.target.value)))}>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                </Select>
                <Pagination count={10} variant="outlined" shape="rounded"
                            onChange={(event, page) => dispatch(setSelectedPage(page))}/>
            </Box>
            {showUserForm && (
                <UserForm
                    user={selectedUser}
                    showForm={showUserForm}
                    onClose={() => {
                        setShowUserForm(false)
                        dispatch(setSelectedUser(null))
                    }}
                />
            )}
        </Stack>
    );
};

export default UserTable;