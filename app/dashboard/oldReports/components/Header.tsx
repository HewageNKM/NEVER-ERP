import React, {useEffect, useState} from 'react';
import {Box, Button, MenuItem, Select, Stack, TextField} from '@mui/material';
import HeaderCard from '@/app/dashboard/components/shared/HeaderCard';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {useAppSelector} from "@/lib/hooks";
import SaleReport from "@/app/dashboard/oldReports/components/SaleReport";
import {getCashReportAction, getExpenseReportAction, getMonthlyOverviewAction, getSalesReportAction, getStocksReportAction} from "@/actions/reportsActions";
import StockReport from "@/app/dashboard/oldReports/components/StockReport";
import {SalesReport} from "@/model";
import CashStatementReport from "@/app/dashboard/oldReports/components/CashStatementReport";
import ExpenseReport from "@/app/dashboard/oldReports/components/ExpenseReport";
import {useSnackbar} from "@/contexts/SnackBarContext";

const Header = () => {
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [selectedType, setSelectedType] = useState("")
    const [totalSale, setTotalSale] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [invoiceCount, setInvoiceCount] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [cost, setCost] = useState(0);
    const [totalDiscount, setTotalDiscount] = useState(0);
    const {currentUser} = useAppSelector(state => state.authSlice);
    const [isLoading, setIsLoading] = useState(true)
    const [isReportLoading, setIsReportLoading] = useState(false)
    const [sales, setSales] = useState(null)
    const [stocks, setStocks] = useState(null)
    const [showSaleReport, setShowSaleReport] = useState(false)
    const [showStockReport, setShowStockReport] = useState(false)
    const [showCashReport, setShowCashReport] = useState(false)
    const [cash, setCash] = useState(null)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [expenses, setExpenses] = useState(null)
    const [showExpenseReport, setShowExpenseReport] = useState(false)
    const {showNotification} = useSnackbar();


    const [years, setYears] = useState([])
    const months = [
        {value: 0, label: 'January'},
        {value: 1, label: 'February'},
        {value: 2, label: 'March'},
        {value: 3, label: 'April'},
        {value: 4, label: 'May'},
        {value: 5, label: 'June'},
        {value: 6, label: 'July'},
        {value: 7, label: 'August'},
        {value: 8, label: 'September'},
        {value: 9, label: 'October'},
        {value: 10, label: 'November'},
        {value: 11, label: 'December'},
    ]

    const onSubmit = async (evt) => {
        try {
            evt.preventDefault();
            setIsReportLoading(true);
            if (selectedType == "sale" && (toDate != null && fromDate != null)) {
                // Set start and end times to include hours, minutes, seconds
                const startDate = fromDate?.toDate();
                startDate.setHours(0, 0, 0);  // Set time to 00:00:00

                const endDate = toDate?.toDate();
                endDate.setHours(23, 59, 59);  // Set time to 23:59:59

                // Convert dates to ISO strings
                const startDateString = startDate.toString();
                const endDateString = endDate.toString();

                console.log("Start Date: ", startDateString);
                console.log("End Date: ", endDateString);

                const response = await getSalesReportAction(startDateString, endDateString);
                setSales({
                    data: response.data.data as SalesReport[],
                    totalDiscount: response.data.totalDiscount,
                    totalOrders: response.data.totalOrders,
                });
                setShowSaleReport(true);
            } else if (selectedType == "stock") {
                const report = await getStocksReportAction();
                setStocks(report);
                setShowStockReport(true);
            } else if (selectedType === "cash" && (toDate != null && fromDate != null)) {
                const startDate = fromDate?.toDate();
                startDate.setHours(0, 0, 0);

                const endDate = toDate?.toDate();
                endDate.setHours(23, 59, 59);

                // Convert dates to ISO strings
                const startDateString = startDate.toString();
                const endDateString = endDate.toString();

                console.log("Start Date: ", startDateString);
                console.log("End Date: ", endDateString);

                const response = await getCashReportAction(startDateString, endDateString);
                setCash(response.data);
                setShowCashReport(true);
            } else if(selectedType === "expense" && (toDate != null && fromDate != null)){
                const startDate = fromDate?.toDate();
                startDate.setHours(0, 0, 0);

                const endDate = toDate?.toDate();
                endDate.setHours(23, 59, 59);

                // Convert dates to ISO strings
                const startDateString = startDate.toString();
                const endDateString = endDate.toString();

                console.log("Start Date: ", startDateString);
                console.log("End Date: ", endDateString);

                const response = await getExpenseReportAction(startDateString,endDateString);
                setExpenses(response);
                setShowExpenseReport(true);
            }else {
                alert("Please select a type and date range");
            }
        } catch (e) {
            showNotification(e.message, "error");
            console.log(e);
        } finally {
            setIsReportLoading(false);
        }
    };


    const fetchMonthlyEarning = async () => {
        setIsLoading(true);
        try {
            const fromDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0).toString();
            const toDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toString();

            console.log("Start Date:", fromDate);
            console.log("End Date:", toDate);

            const overview: {
                totalOrders: number,
                totalEarnings: number,
                totalBuyingCost: number,
                totalProfit: number,
                totalDiscount: number,
                totalExpense: number,
            } = await getMonthlyOverviewAction(fromDate, toDate);

            setTotalSale(overview.totalEarnings | 0);
            setTotalProfit(overview.totalProfit | 0);
            setInvoiceCount(overview.totalOrders | 0);
            setTotalDiscount(overview.totalDiscount | 0);
            setCost(overview.totalBuyingCost | 0);
            setTotalExpenses(overview.totalExpense | 0);
        } catch (error) {
            console.error("Error fetching daily earnings:", error.message, error.stack);
            showNotification(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const years = [];
        for (let i = selectedYear; i >= selectedYear - 3; i--) {
            years.push(i);
        }
        setYears(years);
    }, [])

    useEffect(() => {
        if (currentUser) {
            fetchMonthlyEarning()
        }
    }, [selectedMonth, selectedYear, currentUser]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack
                sx={{
                    position: 'relative',
                    padding: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
            >
                <Stack sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 3,
                    flexWrap: 'wrap',
                    justifyContent: 'end',
                    width: '100%',
                }}>
                    <Select
                        variant="outlined"
                        displayEmpty
                        defaultValue={selectedYear}
                        onChange={(event) => setSelectedYear(event.target.value as number)}
                    >
                        {years.map((year, index) => (
                            <MenuItem key={index} value={year}>{year}</MenuItem>
                        ))}
                    </Select>
                    <Select
                        variant="outlined"
                        displayEmpty
                        defaultValue={selectedMonth}
                        onChange={(event) => setSelectedMonth(event.target.value as number)}
                    >
                        {months.map((month, index) => (
                            <MenuItem key={index} value={month.value}>{month.label}</MenuItem>
                        ))}
                    </Select>
                </Stack>
                <Stack
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 3,
                        flexWrap: 'wrap',
                        justifyContent: 'space-evenly',
                        width: '100%',
                    }}
                >
                    <HeaderCard
                        invoices={invoiceCount}
                        isLoading={isLoading}
                        startDate={new Date(selectedYear, selectedMonth, 1, 0, 0, 0).toLocaleString()}
                        endDate={new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toLocaleString()}
                        title={'Sales'}
                        value={totalSale}
                    />
                    <HeaderCard
                        invoices={invoiceCount}
                        isLoading={isLoading}
                        title={"Cost"}
                        value={cost}
                        startDate={new Date(selectedYear, selectedMonth, 1, 0, 0, 0).toLocaleString()}
                        endDate={new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toLocaleString()}
                    />
                    <HeaderCard
                        invoices={invoiceCount}
                        isLoading={isLoading}
                        startDate={new Date(selectedYear, selectedMonth, 1, 0, 0, 0).toLocaleString()}
                        endDate={new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toLocaleString()}
                        title={'Profit(Fee Exl)'}
                        value={totalProfit}
                    />
                    <HeaderCard
                        title={"Expenses"}
                        value={totalExpenses}
                        startDate={new Date(selectedYear, selectedMonth, 1,).toLocaleString()}
                        endDate={new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toLocaleString()}
                        isLoading={isLoading} invoices={invoiceCount}/>
                </Stack>
                <form onSubmit={onSubmit}>
                    <Stack
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 3,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            width: '100%',
                            alignItems: 'center',
                        }}
                    >
                        <Box>
                            <Select
                                variant="outlined"
                                value={selectedType}
                                onChange={(event) => setSelectedType(event.target.value as string)}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>
                                    Select Type
                                </MenuItem>
                                <MenuItem value={"sale"}>Sale</MenuItem>
                                <MenuItem value={"stock"}>Stock</MenuItem>
                                <MenuItem value={"cash"}>Statement</MenuItem>
                                <MenuItem value={"expense"}>Expense</MenuItem>
                            </Select>
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 3,
                            justifyContent: 'center',
                        }}>
                            <DatePicker
                                disabled={selectedType === "" || selectedType === "stock" || isReportLoading}
                                label="From"
                                value={fromDate}
                                onChange={(newValue) => setFromDate(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                            <DatePicker
                                label="To"
                                disabled={selectedType === "" || selectedType === "stock" || isReportLoading}
                                value={toDate}
                                onChange={(newValue) => setToDate(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </Box>
                        <Box>
                            <Button disabled={isReportLoading}
                                    className={"disabled:opacity-60 disabled:cursor-not-allowed"}
                                    type={"submit"} variant={"contained"}>
                                View Report
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </Stack>
            <SaleReport sales={sales} setShow={() => setShowSaleReport(false)} show={showSaleReport} date={() => {
                const startDate = fromDate?.toDate();
                startDate?.setHours(0, 0, 0);  // Set time to 00:00:00

                const endDate = toDate?.toDate();
                endDate?.setHours(23, 59, 59);  // Set time to 23:59:59

                // Convert dates to ISO strings
                const startDateString = startDate?.toLocaleString();
                const endDateString = endDate?.toLocaleString();

                return `${startDateString} - ${endDateString}`
            }}/>
            <StockReport show={showStockReport} setShow={() => setShowStockReport(false)} stocks={stocks}/>
            <CashStatementReport setShow={() => setShowCashReport(false)} cash={cash} show={showCashReport} date={() => {
                const startDate = fromDate?.toDate();
                startDate?.setHours(0, 0, 0);  // Set time to 00:00:00

                const endDate = toDate?.toDate();
                endDate?.setHours(23, 59, 59);  // Set time to 23:59:59

                // Convert dates to ISO strings
                const startDateString = startDate?.toLocaleString();
                const endDateString = endDate?.toLocaleString();

                return `${startDateString} - ${endDateString}`
            }}/>
            <ExpenseReport expenseReport={expenses} date={() => {
                const startDate = fromDate?.toDate();
                startDate?.setHours(0, 0, 0);  // Set time to 00:00:00

                const endDate = toDate?.toDate();
                endDate?.setHours(23, 59, 59);  // Set time to 23:59:59

                // Convert dates to ISO strings
                const startDateString = startDate?.toLocaleString();
                const endDateString = endDate?.toLocaleString();

                return `${startDateString} - ${endDateString}`
            }} setShow={()=>setShowExpenseReport(false)} show={showExpenseReport} />
        </LocalizationProvider>
    );
};

export default Header;
