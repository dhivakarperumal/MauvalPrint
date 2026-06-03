import React, { useContext, useState, useEffect } from "react";
import {
  FaBox,
  FaClipboardList,
  FaDownload,
  FaFileAlt,
  FaFileInvoice,
  FaStar,
  FaMoneyCheckAlt,
  FaWallet,
  FaCreditCard,
  FaMoneyBillWave,
} from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { FaChartBar } from "react-icons/fa";
import { FaUserFriends } from "react-icons/fa";
import { Doughnut } from "react-chartjs-2";
import { ArcElement } from "chart.js";
import api from "../api";
import { AuthContext } from "../Context/AuthContext";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement
);

const data = {
  labels: ["Red", "Blue", "Green", "Yellow"],
  datasets: [
    {
      label: "T-Shirt Sales",
      data: [12, 19, 8, 15],
      backgroundColor: ["#f87171", "#60a5fa", "#34d399", "#fbbf24"],
      borderRadius: 8,
      barThickness: 30,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlySales, setMonthlySales] = useState(Array(12).fill(0));

  const [categorySalesData, setCategorySalesData] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});
  const [weeklyIncome, setWeeklyIncome] = useState([]);
  const [Orders, setOrders] = useState([]);

  const [categoryOrderStats, setCategoryOrderStats] = useState({});
  const getCategoryCountFromOrders = async () => {
    try {
      const { data } = await api.get("/orders");
      const orders = data?.orders || [];
      const categoryCount = {};

      orders.forEach((order) => {
        const items = order.cart || order.items || [];

        items.forEach((item) => {
          const category = item.category || "Uncategorized";
          const quantity = item.quantity || 1;

          if (categoryCount[category]) {
            categoryCount[category] += quantity;
          } else {
            categoryCount[category] = quantity;
          }
        });
      });

      setCategoryOrderStats(categoryCount);
    } catch (error) {
      console.error("Error fetching category order counts:", error);
    }
  };
  useEffect(() => {
    getCategoryCountFromOrders();
  }, []);
  const categoryOrderLineData = {
    labels: Object.keys(categoryOrderStats),
    datasets: [
      {
        label: "Units Sold",
        data: Object.values(categoryOrderStats),
        backgroundColor: "rgba(16, 185, 129, 0.85)", // Solid emerald
        hoverBackgroundColor: "rgba(5, 150, 105, 1)",
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const categoryOrderLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#f1f5f9",
          drawBorder: false,
          borderDash: [5, 5],
        },
        ticks: {
          precision: 0,
          color: "#94a3b8",
          font: { family: "'Inter', sans-serif", size: 12 },
          padding: 10,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#64748b",
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
    },
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [productsRes, usersRes, ordersRes, reviewsRes, invoicesRes] = await Promise.all([
          api.get("/products"),
          api.get("/users"),
          api.get("/orders"),
          api.get("/reviews"),
          api.get("/invoices"),
        ]);

        setProductCount(productsRes.data?.products?.length || 0);
        setUserCount(usersRes.data?.users?.length || 0);
        setOrderCount(ordersRes.data?.orders?.length || 0);
        setReviewCount(reviewsRes.data?.reviews?.length || 0);
        setInvoiceCount(invoicesRes.data?.invoices?.length || 0);

        setOrders(ordersRes.data?.orders || []);
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        const { data } = await api.get("/products");
        const products = data?.products || [];
        const categoryCount = {};

        products.forEach((product) => {
          const category = product.category || "Unknown";
          const stock = product.stock || 0;

          if (categoryCount[category]) {
            categoryCount[category] += stock;
          } else {
            categoryCount[category] = stock;
          }
        });

        setCategoryStats(categoryCount);
      } catch (error) {
        console.error("Error fetching category stats:", error);
      }
    };

    fetchCategoryStats();
  }, []);

  const categoryNames = Object.keys(categoryStats);
  const categoryStock = Object.values(categoryStats);

  const chartData = {
    labels: categoryNames,
    datasets: [
      {
        label: "Stock by Category",
        data: categoryStock,
        backgroundColor: [
          "#4e79a7",
          "#f28e2b",
          "#e15759",
          "#76b7b2",
          "#59a14f",
          "#edc949",
          "#af7aa1",
          "#ff9da7",
          "#9c755f",
          "#bab0ac",
        ],
        borderRadius: 8,
        barThickness: 30,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Stock: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#4a4a4a",
          font: { size: 12 },
        },
      },
      y: {
        grid: {
          drawBorder: false,
          color: "#f0f0f0",
        },
        ticks: {
          beginAtZero: true,
          stepSize: 10,
        },
      },
    },
  };
  // Get past 7 days labels
  const getLast7DaysLabels = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    }
    return days;
  };

  useEffect(() => {
    const fetchWeeklyIncome = async () => {
      try {
        const { data } = await api.get("/orders");
        const orders = data?.orders || [];

        const today = new Date();
        const dayTotals = Array(7).fill(0);

        orders.forEach((order) => {
          if (order.status !== "Delivered") return;

          const createdAt = order.created_at
            ? new Date(order.created_at)
            : null;

          if (!createdAt || Number.isNaN(createdAt.getTime())) return;

          const diff = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));

          if (diff >= 0 && diff < 7) {
            const dayIndex = 6 - diff;
            dayTotals[dayIndex] += parseFloat(order.total || 0);
          }
        });

        setWeeklyIncome(dayTotals);
      } catch (error) {
        console.error("Error fetching weekly income:", error);
      }
    };

    fetchWeeklyIncome();
  }, []);

  const labels = getLast7DaysLabels();

  const weeklyIncomeData = {
    labels,
    datasets: [
      {
        label: "Weekly Income",
        data: weeklyIncome,
        backgroundColor: "rgba(99, 102, 241, 0.85)",
        hoverBackgroundColor: "rgba(79, 70, 229, 1)",
        borderRadius: 6,
        barPercentage: 0.5,
      },
    ],
  };

  const weeklyIncomeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `₹ ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
          color: "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f1f5f9",
          drawBorder: false,
          borderDash: [5, 5],
        },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
          color: "#94a3b8",
          callback: (value) => `₹${value.toLocaleString()}`,
          padding: 10,
        },
      },
    },
  };

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const { data } = await api.get("/orders");
        const orders = data?.orders || [];

        let orderTotal = orders.length;
        let itemsSold = 0;
        let revenue = 0;
        let monthlyTotals = Array(12).fill(0);

        orders.forEach((order) => {
          const cart = order.cart || [];
          const orderItemsQty = cart.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          );
          itemsSold += orderItemsQty;

          revenue += parseFloat(order.total || 0) || 0;

          const createdAt = order.created_at
            ? new Date(order.created_at)
            : null;

          if (createdAt && !Number.isNaN(createdAt.getTime())) {
            const monthIndex = createdAt.getMonth();
            monthlyTotals[monthIndex] += parseFloat(order.total || 0) || 0;
          }
        });

        setOrderCount(orderTotal);
        setTotalItemsSold(itemsSold);
        setTotalRevenue(revenue);
        setMonthlySales(monthlyTotals);
      } catch (error) {
        console.error("Error fetching order stats:", error);
      }
    };

    fetchOrderStats();
  }, []);

  const [topSellingProducts, setTopSellingProducts] = useState([]);

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        const { data } = await api.get("/orders");
        const orderData = data?.orders || [];

        const productSalesMap = {};

        orderData.forEach((order) => {
          const items = order.cart || order.products || [];

          items.forEach((product) => {
            const key = product.productId || product.id || product.name;

            if (!productSalesMap[key]) {
              productSalesMap[key] = {
                name: product.name || "Unknown",
                category: product.category || "Unknown",
                image: product.image || product.images?.[0] || "/no-image.png",
                price: product.price || 0,
                unitsSold: 0,
              };
            }

            productSalesMap[key].unitsSold += parseInt(product.quantity || 1, 10);
          });
        });

        const sortedProducts = Object.values(productSalesMap)
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, 5);

        setTopSellingProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
      }
    };

    fetchTopSellingProducts();
  }, []);

  const [notifications, setNotifications] = useState([]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/orders");
      const orders = data?.orders || [];
      const todayStr = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let totalRevenue = 0;
      let monthlyRevenue = 0;

      const normalized = orders.map((order) => {
        const createdAt = order.created_at
          ? new Date(order.created_at)
          : null;

        if (order.status === "Delivered") {
          const orderTotal = parseFloat(order.total) || 0;
          totalRevenue += orderTotal;

          if (
            createdAt &&
            createdAt.getMonth() === currentMonth &&
            createdAt.getFullYear() === currentYear
          ) {
            monthlyRevenue += orderTotal;
          }
        }

        const firstItem = order.cart?.[0] || {};

        return {
          id: order.order_id || order.id || "",
          ...order,
          createdAt,
          customerName:
            order.checkout?.customerName ||
            order.checkout?.name ||
            order.user_email ||
            order.fullname ||
            order.name ||
            "Unknown",
          image:
            firstItem.image ||
            firstItem.customizedImage ||
            firstItem.images?.[0] ||
            "/no-image.png",
          name: firstItem.name || "Product",
          price: firstItem.price || 0,
          time: createdAt?.toLocaleTimeString() || "Just now",
        };
      });

      const todayOrders = normalized.filter(
        (order) =>
          order.createdAt &&
          order.createdAt.toISOString().split("T")[0] === todayStr &&
          ["Placed", "Place Order"].includes(order.status)
      );

      setNotifications(todayOrders);
      setMonthlyRevenue(monthlyRevenue);
      setTotalRevenue(totalRevenue);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    const base = "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider";
    switch (status) {
      case "Placed":
        return `${base} bg-emerald-100/80 text-emerald-700 border border-emerald-200/50`;
      case "Cancelled":
        return `${base} bg-rose-100/80 text-rose-700 border border-rose-200/50`;
      case "Pending":
        return `${base} bg-amber-100/80 text-amber-700 border border-amber-200/50`;
      default:
        return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        const categoryList = data?.categories || [];

        const topCategories = categoryList.slice(0, 5);

        const labels = topCategories.map((cat) => cat.name || cat.cname || "Unnamed");
        const dataValues = new Array(topCategories.length).fill(1);

        setCategorySalesData({
          labels,
          datasets: [
            {
              label: "Categories",
              data: dataValues,
              backgroundColor: [
                "#4F46E5",
                "#10B981",
                "#F59E0B",
                "#EF4444",
                "#3B82F6",
              ],
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const categorySalesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#4B5563",
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}`,
        },
      },
    },
  };

  const categorySales = topSellingProducts.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + (product.unitsSold || 0);
    return acc;
  }, {});
  const categoryChartData = {
    labels: Object.keys(categorySales),
    datasets: [
      {
        label: "Units Sold",
        data: Object.values(categorySales),
        backgroundColor: [
          "#3B82F6",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#8B5CF6",
          "#06B6D4",
        ],
        borderRadius: 6,
      },
    ],
  };

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#6B7280",
        },
      },
      x: {
        ticks: {
          color: "#6B7280",
        },
      },
    },
  };

    return (
    <div className="px-4 py-8 bg-slate-50 min-h-screen space-y-8 font-sans">
      {/* Header */}
      <div
        data-aos="fade-down"
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2"
      >
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Hello, {user.username || user.name}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Here is what's happening with your store today.</p>
        </div>
        <div className="flex gap-4 mt-6 sm:mt-0">
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-end">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Sales</p>
            <p className="text-xl font-black text-slate-800">₹{monthlyRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-end">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Revenue</p>
            <p className="text-xl font-black text-slate-800">₹{totalRevenue.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-0 mb-6">
        {/* Best Seller Card */}
        <div
          data-aos="fade-right"
          className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl border border-slate-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Congratulations, {user.username || user.name}! 🎉
            </h3>
            <p className="text-slate-300 font-medium">
              You are the top seller of the month. Keep up the great work!
            </p>
          </div>
          
          <div className="mt-12 mb-2 relative z-10">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 shadow-sm">Monthly Revenue</p>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 drop-shadow-md">
              ₹ {monthlyRevenue.toLocaleString()} 
            </div>
          </div>

          <div className="absolute bottom-4 right-4 opacity-90 w-32 hidden sm:block pointer-events-none">
            <img src="/happy.svg" alt="Happy" className="w-full h-auto drop-shadow-2xl" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Stock by Category</h3>
          <div className="relative h-55">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Firebase-Driven Stat Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatBox
          title="Products"
          count={productCount}
          color="blue"
          icon={<FaBox size={22} className="text-white drop-shadow-sm" />}
        />
        <StatBox
          title="Orders"
          count={orderCount}
          color="red"
          icon={<FaClipboardList size={22} className="text-white drop-shadow-sm" />}
        />
        <StatBox
          title="Reviews"
          count={reviewCount}
          color="purple"
          icon={<FaStar size={22} className="text-white drop-shadow-sm" />}
        />
        <StatBox
          title="Users"
          count={userCount}
          color="green"
          icon={<FaUserFriends size={22} className="text-white drop-shadow-sm" />}
        />
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-100 transition-colors duration-500"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Weekly Income
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Revenue from delivered orders over the past 7 days
            </p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-3 shadow-inner">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">7-Day Total</span>
            <span className="text-xl font-black">₹{weeklyIncome.reduce((a, b) => a + b, 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="relative z-10 h-[350px] w-full">
          <Bar data={weeklyIncomeData} options={weeklyIncomeOptions} />
        </div>
      </div>

      {/* Orders and Transactions */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Today's Orders</h3>
        </div>
        
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
          <table className="min-w-[750px] w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const todayOrdersFiltered = Orders.filter((order) => {
                  const today = new Date().toISOString().split('T')[0];
                  const dateValue = order.created_at || order.createdAt;
                  const createdAtDate = dateValue?.toDate ? dateValue.toDate() : (dateValue ? new Date(dateValue) : new Date(0));
                  const orderDate = createdAtDate.toISOString().split('T')[0];
                  return orderDate === today;
                });

                if (todayOrdersFiltered.length === 0) {
                  return (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                            <FaClipboardList className="text-slate-300 text-2xl" />
                          </div>
                          <p className="text-slate-500 font-bold text-base">No orders yet today</p>
                          <p className="text-slate-400 text-sm">When new orders are placed, they will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return todayOrdersFiltered.map(
                  (order, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-700">{order.order_id || order.orderID}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{order?.checkout?.fullname || order?.checkout?.customerName || order?.customerName || "Unknown"}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {order.payment_id || order.paymentID ? "Online" : "Cash on Delivery"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">₹{order.total}</td>
                    </tr>
                  )
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top Category Sales */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-4">
            Top Categories
          </h3>
          <div className="h-80 flex justify-center items-center">
            {categorySalesData ? (
              <Doughnut
                data={categorySalesData}
                options={categorySalesOptions}
              />
            ) : (
              <p className="text-slate-400 font-medium">Loading chart...</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-emerald-100 transition-colors duration-500"></div>
          <div className="relative z-10 mb-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Order Trends by Category
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Quantity of items sold across different categories
            </p>
          </div>
          {Object.keys(categoryOrderStats).length > 0 ? (
            <div className="relative z-10 h-80 w-full">
              <Bar
                data={categoryOrderLineData}
                options={categoryOrderLineOptions}
              />
            </div>
          ) : (
            <div className="relative z-10 h-80 w-full flex justify-center items-center">
              <p className="text-slate-400 font-medium">No order data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ title, count, color, icon }) => {
  const gradientMap = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    red: "bg-gradient-to-br from-orange-400 to-orange-500",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600",
    green: "bg-gradient-to-br from-emerald-400 to-emerald-500",
  };

  return (
    <div className={`relative overflow-hidden rounded-xl p-5 ${gradientMap[color]} shadow-md flex flex-col justify-between group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4 blur-xl"></div>
      <div className="absolute bottom-0 right-10 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 blur-lg"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 shadow-sm">{title}</p>
          <p className="text-4xl font-black text-white drop-shadow-md tracking-tighter">{count}</p>
        </div>
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      
      <div className="mt-6 relative z-10">
        <p className="text-xs text-white/90 mb-2 font-medium">Total registered {title.toLowerCase()}</p>
        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
