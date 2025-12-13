import React from 'react';
import {Box} from "@mui/material";
import Typography from "@mui/material/Typography";

const HeaderCard = ({title, value,startDate,endDate,isLoading,invoices}: { title: string, value: number,startDate:string,endDate:string,isLoading:boolean,invoices:number }) => {
    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            padding: 1,
            border: "1px solid #ccc",
            borderRadius: 2,
            position: "relative",
            maxWidth: 350,
        }}>
            <Box>
                <Box>
                    <Typography variant={"h6"}>{title}({invoices})</Typography>
                </Box>
                <Box>
                    <Typography variant={"h3"}>
                        {isLoading ? "Loading..." : `LKR ${value.toFixed(2)}`}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{
                display: "flex",
                flexDirection: "row",
                gap: 3,
                justifyContent: "space-evenly",
                width: "100%",
                marginTop: 2
            }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    <Box>
                        <Typography variant={"body2"}>From</Typography>
                    </Box>
                    <Box>
                        <Typography variant={"body1"}>
                            {startDate}
                        </Typography>
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    <Box>
                        <Typography variant={"body2"}>To</Typography>
                    </Box>
                    <Box>
                        <Typography variant={"body1"}>
                            {endDate}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default HeaderCard;