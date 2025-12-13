import React from 'react';
import {Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField} from "@mui/material";
import Typography from "@mui/material/Typography";
import {IoRefreshCircle} from "react-icons/io5";
import {getAllUsers, setSelectedRole, setSelectedStatus} from "@/lib/usersSlice/usersSlice";
import {useAppDispatch, useAppSelector} from "@/lib/hooks";

const Header = () => {
    const {selectedStatus, selectedRole, selectedPage, selectedSize} = useAppSelector(state => state.usersSlice);
    const dispatch = useAppDispatch();
    const onSearch = async (evt) => {
        try {
            evt.preventDefault()
        } catch (e) {
            console.error(e);
        }
    }
    return (
        <Stack direction="column" spacing={2} alignItems="start" flexWrap={"wrap"} justifyContent="space-between" p={2}>
            <Stack>
                <Stack>
                    <Typography
                        variant={"h5"}
                    >
                        Options
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={5} alignItems="center" justifyContent="space-between" py={2}
                       flexWrap={"wrap"}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl variant="outlined" size="small">
                            <InputLabel id="Status-label">Status</InputLabel>
                            <Select
                                placeholder={"Status"}
                                labelId="Status-label"
                                label="Status"
                                value={selectedStatus}
                                onChange={(e) => dispatch(setSelectedStatus(e.target.value))}
                                defaultValue="all"
                            >
                                <MenuItem value={"all"} key="all">All</MenuItem>
                                <MenuItem
                                    key="active"
                                    value="Active"
                                >
                                    Active
                                </MenuItem>
                                <MenuItem
                                    key="inactive"
                                    value="Inactive"
                                >
                                    Inactive
                                </MenuItem>
                            </Select>
                        </FormControl>
                        {/* Filter Dropdown */}
                        <FormControl variant="outlined" size="small">
                            <InputLabel id="Role-label">Role</InputLabel>
                            <Select
                                placeholder={"Role"}
                                labelId="Role-label"
                                label="Role"
                                value={selectedRole}
                                onChange={(e) => dispatch(setSelectedRole(e.target.value))}
                                defaultValue="all"
                            >
                                <MenuItem value={"all"} key="all">All</MenuItem>
                                <MenuItem
                                    key="admin"
                                    value="Admin"
                                >
                                    Admin
                                </MenuItem>
                                <MenuItem
                                    key="user"
                                    value="User"
                                >
                                    User
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default Header;