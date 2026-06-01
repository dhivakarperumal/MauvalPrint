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
import { collection, getDocs } from "firebase/firestore";
import { db } from ".././firebase";
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
      const snapshot = await getDocs(collection(db, "orders"));
      const categoryCount = {};

      snapshot.forEach((doc) => {
        const order = doc.data();

        // Use cart or items field
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
        label: "Units Sold per Category",
        data: Object.values(categoryOrderStats),
        fill: true,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const categoryOrderLineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#4B5563",
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
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

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const productsSnap = await getDocs(collection(db, "products"));
        const usersSnap = await getDocs(collection(db, "users"));
        const ordersSnap = await getDocs(collection(db, "orders"));
        const reviewsSnap = await getDocs(collection(db, "reviews"));
        const invoicesSnap = await getDocs(collection(db, "invoices"));

        setProductCount(productsSnap.size);
        setUserCount(usersSnap.size);
        setOrderCount(ordersSnap.size);
        setReviewCount(reviewsSnap.size);
        setInvoiceCount(invoicesSnap.size);

        // ✅ Convert order snapshots to usable array
        const ordersData = ordersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(ordersData); // store all orders here
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      const productsSnapshot = await getDocs(collection(db, "products"));
      const categoryCount = {};

      productsSnapshot.forEach((doc) => {
        const data = doc.data();
        const category = data.category || "Unknown";
        const stock = data.stock || 0;

        if (categoryCount[category]) {
          categoryCount[category] += stock;
        } else {
          categoryCount[category] = stock;
        }
      });

      setCategoryStats(categoryCount);
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
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs.map((doc) => doc.data());

      const today = new Date();
      const dayTotals = Array(7).fill(0);

      orders.forEach((order) => {
        if (order.status === "Delivered" && order.createdAt?.toDate) {
          const orderDate = order.createdAt.toDate();
          const diff = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));

          if (diff >= 0 && diff < 7) {
            const dayIndex = 6 - diff;
            dayTotals[dayIndex] += order.total || 0;
          }
        }
      });

      setWeeklyIncome(dayTotals);
    };

    fetchWeeklyIncome();
  }, []);

  const labels = getLast7DaysLabels();

  const data = {
    labels,
    datasets: [
      {
        label: "Weekly Income (₹)",
        data: weeklyIncome,
        backgroundColor: [
          "#4F46E5",
          "#6366F1",
          "#818CF8",
          "#A5B4FC",
          "#C7D2FE",
          "#E0E7FF",
          "#EEF2FF",
        ],
        borderRadius: 20,
        barPercentage: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `₹${context.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`,
        },
      },
    },
  };

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));
        let orderTotal = snapshot.size;
        let itemsSold = 0;
        let revenue = 0;
        let monthlyTotals = Array(12).fill(0);

        snapshot.forEach((doc) => {
          const order = doc.data();

          // ✅ Sum quantities
          const cart = order.cart || [];
          const orderItemsQty = cart.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          );
          itemsSold += orderItemsQty;

          // ✅ Add total amount (ensure numeric)
          revenue += parseFloat(order.total || 0);

          // ✅ Process order date (assumes `order.date` is in ISO string like "2025-07-12")
          if (order.date) {
            const orderDate = new Date(order.date);
            if (!isNaN(orderDate)) {
              const monthIndex = orderDate.getMonth(); // 0 for Jan
              monthlyTotals[monthIndex] += parseFloat(order.total || 0);
            }
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
        const snapshot = await getDocs(collection(db, "orders"));
        const orderData = snapshot.docs.map((doc) => doc.data());

        const productSalesMap = {};

        orderData.forEach((order) => {
          const items = order.products || [];

          items.forEach((product) => {
            const key = product.productId || product.name;

            if (!productSalesMap[key]) {
              productSalesMap[key] = {
                name: product.name,
                category: product.category,
                image: product.image,
                price: product.price,
                unitsSold: 0,
              };
            }

            productSalesMap[key].unitsSold += parseInt(product.quantity || 1);
          });
        });

        const sortedProducts = Object.values(productSalesMap)
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, 5); // Top 5

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
      const snapshot = await getDocs(collection(db, "orders"));
      const todayStr = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let totalRevenue = 0;
      let monthlyRevenue = 0;

      const data = snapshot.docs.map((doc) => {
        const order = doc.data();
        let createdAt = null;

        if (order.createdAt?.toDate) {
          createdAt = order.createdAt.toDate();
        } else if (typeof order.createdAt === "string") {
          createdAt = new Date(order.createdAt);
        }

        // Revenue calculation (only for Delivered orders)
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
          id: doc.id,
          ...order,
          createdAt,
          customerName: order.fullname || order.name || "Unknown",
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

      const todayOrders = data.filter(
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
    const base = "text-xs font-semibold px-2 py-1 rounded-full";
    switch (status) {
      case "Placed":
        return `${base} bg-green-100 text-green-700`;
      case "Cancelled":
        return `${base} bg-red-100 text-red-700`;
      case "Pending":
        return `${base} bg-yellow-100 text-yellow-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const topCategories = categoryList.slice(0, 5);

        const labels = topCategories.map((cat) => cat.cname || "Unnamed");
        const data = new Array(topCategories.length).fill(1);

        setCategorySalesData({
          labels,
          datasets: [
            {
              label: "Categories",
              data,
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
    <div className="px-3 py-6 bg-[#f4f7fe] min-h-screen space-y-8">
      {/* Header */}
      <div
        data-aos="fade-down"
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200"
      >
        <div>
          <h2 className="text-2xl font-bold capitalize text-blue-900">
            Hello {user.username || user.name},
          </h2>
          <p className="text-sm text-gray-500">Have a good day :)</p>
        </div>
        <div className="flex gap-8 mt-4 sm:mt-0">
          <div className="text-md text-black font-bold">
            <p className="text-lg font-semibold">
              ₹{monthlyRevenue.toLocaleString()}
            </p>

            <p className="text-md text-gray-500">Monthly Sales</p>
          </div>
          <div className="text-md text-black font-bold">
            <p>₹ {totalRevenue.toFixed(0)}</p>
            <p className="text-md text-gray-500">Overall Revenue</p>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-0">
        {/* Best Seller Card */}
        <div
          data-aos="fade-right"
          className="bg-gray-900 text-white rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold">
              Congratulations {user.name} 🎉
            </h3>
            <p className="text-sm mt-1">
              You are the best seller of the month.
            </p>
          </div>
          <div className="mt-6 text-3xl font-bold">
            ₹ {monthlyRevenue.toLocaleString()} 
          </div>

          <div>
            <img src="/happy.svg" alt="" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <img
            src="/delivery.png"
            alt="T-shirt Delivery"
            className="w-full h-30 object-contain mb-4"
          />

          <div className="flex justify-around text-blue-600 font-semibold text-sm mb-6">
            {categoryNames
              .sort((a, b) => a.length - b.length)
              .map((cat, idx) => (
                <div key={idx}>
                  <p>{cat}</p>
                  <div
                    className={`h-2 rounded-full`}
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${(idx + 1) * 0.2})`,
                      width: `${cat.length * 6.5}px`,
                    }}
                  ></div>
                </div>
              ))}
          </div>

          <div className="relative h-55">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Firebase-Driven Stat Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox
          title="Products"
          count={productCount}
          color="blue"
          icon={
            <FaBox
              size={50}
              className="text-white text-2xl border-2 p-2 rounded-lg"
            />
          }
        />
        <StatBox
          title="Orders"
          count={orderCount}
          color="red"
          icon={
            <FaClipboardList
              size={50}
              className="text-white text-2xl border-2 p-2 rounded-lg"
            />
          }
        />
        <StatBox
          title="Reviews"
          count={reviewCount}
          color="purple"
          icon={
            <FaStar
              size={50}
              className="text-white text-2xl border-2 p-2 rounded-lg"
            />
          }
        />
        <StatBox
          title="Users"
          count={userCount}
          color="green"
          icon={
            <FaUserFriends
              size={50}
              className="text-white text-2xl border-2 p-2 rounded-lg"
            />
          }
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Weekly Income (Delivered Orders)
        </h2>
        <div className="h-110">
          <Bar data={data} options={options} />
        </div>
      </div>

      {/* Orders and Transactions */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-5">Today's Orders</h3>

        {Orders.filter((order) => {
          const today = new Date().toISOString().split('T')[0];
          const createdAtDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt ? new Date(order.createdAt) : new Date(0));
          const orderDate = createdAtDate.toISOString().split('T')[0];
          return order.status === "Placed" && orderDate === today;
        }).length === 0 ? (
          <p className="text-gray-500 text-sm">No orders found for today.</p>
        ) : (
          <div className="hidden md:block overflow-x-auto shadow rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-4 font-semibold">OrderId</th>
                  <th className="px-4 py-4 font-semibold">Customer</th>
                  <th className="px-4 py-4 font-semibold">Payment</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {Orders.filter((order) => {
                  const today = new Date().toISOString().split('T')[0];
                  const createdAtDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt ? new Date(order.createdAt) : new Date(0));
                  const orderDate = createdAtDate.toISOString().split('T')[0];
                  return order.status === "Placed" && orderDate === today;
                }).map(
                  (order, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">{order.orderID}</td>
                      <td className="px-4 py-4">{order?.checkout.fullname}</td>
                      <td className="px-4 py-4">
                        {order.paymentID ? "Online" : "Cash on Delivery"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={getStatusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium">₹{order.total}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 px-2">
        {/* Top Category Sales */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top Categories
          </h3>
          <div className="h-80 flex justify-center items-center">
            {categorySalesData ? (
              <Doughnut
                data={categorySalesData}
                options={categorySalesOptions}
              />
            ) : (
              <p className="text-gray-500">Loading chart...</p>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Category Orders Line Chart
          </h3>
          {Object.keys(categoryOrderStats).length > 0 ? (
            <div className="h-60">
              <Line
                data={categoryOrderLineData}
                options={categoryOrderLineOptions}
              />
            </div>
          ) : (
            <p className="text-gray-500">No order data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ title, count, color, icon }) => {
  const gradientMap = {
    blue: "bg-blue-600",
    red: "bg-red-600",
    purple: "bg-purple-600",
    green: "bg-green-600",
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow  gap-4 relative">
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-lg absolute top-[-10px] text-lg ${gradientMap[color]}`}
      >
        {icon}
      </div>
      <div className="flex items-center justify-center mt-5 flex-col">
        <p className="text-xl font-bold">{count}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
};

export default Dashboard;
