import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import GestureRecognizer from "react-native-swipe-gestures";
import * as Haptics from "expo-haptics";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import moment from "moment";

//aggregation
const organizeTransactions = (transactions) => {
  let d = [];
  let w = [];
  let m = [];
  let daily = {};
  let weekly = {};
  let monthly = {};
  let currentWeekKey = `Week ${moment().format("ww")}, ${moment().format(
    "YYYY"
  )}`;
  let categoryTotals = {
    Home: 0,
    Personal: 0,
    Food: 0,
  };

  transactions.forEach((transaction) => {
    const date = moment(transaction.date, "DD/MM/YYYY");
    const dayKey = date.format("YYYY-MM-DD");
    const weekKey = `Week ${date.format("ww")}, ${date.format("YYYY")}`;
    const monthKey = date.format("MMMM YYYY");

    daily[dayKey] = (daily[dayKey] || 0) + parseFloat(transaction.total);
    weekly[weekKey] = (weekly[weekKey] || 0) + parseFloat(transaction.total);
    monthly[monthKey] =
      (monthly[monthKey] || 0) + parseFloat(transaction.total);
  });

  Object.keys(daily)
    .sort()
    .reverse()
    .forEach((key) => {
      d.push({ date: key, total: daily[key] });
    });
  Object.keys(weekly)
    .sort()
    .reverse()
    .forEach((key) => {
      w.push({ week: key, total: weekly[key] });
    });

  Object.keys(monthly)
    .map((key) => {
      const [month, year] = key.split(" ");
      return {
        monthKey: key,
        sortableDate: moment(key, "MMMM YYYY").toDate(),
        total: monthly[key],
      };
    })
    .sort((a, b) => b.sortableDate - a.sortableDate)
    .forEach((item) => {
      m.push({ month: item.monthKey, total: item.total });
    });

  return { Daily: d, Weekly: w, Monthly: m };
};

const organizeTransactionsByCategory = (transactions) => {
  let currentWeekKey = `Week ${moment().format("ww")}, ${moment().format(
    "YYYY"
  )}`;

  let categoryTotals = {
    Home: { Daily: 0, Weekly: 0, Monthly: 0 },
    Personal: { Daily: 0, Weekly: 0, Monthly: 0 },
    Food: { Daily: 0, Weekly: 0, Monthly: 0 },
  };

  transactions.forEach((transaction) => {
    const date = moment(transaction.date, "DD/MM/YYYY");
    const dayKey = date.format("YYYY-MM-DD");
    const weekKey = `Week ${date.format("ww")}, ${date.format("YYYY")}`;
    const monthKey = date.format("MMMM YYYY");

    categoryTotals[transaction.category].Weekly += parseFloat(
      transaction.total
    );

    categoryTotals[transaction.category].Daily += parseFloat(transaction.total); 
    categoryTotals[transaction.category].Monthly += parseFloat(
      transaction.total
    );
  });

  return categoryTotals;
};

const organizeLastWeekTransactions = (transactions) => {
  const lastWeekDates = [...Array(7)]
    .map((_, i) => moment().subtract(i, "days").format("YYYY-MM-DD"))
    .reverse();
  let dailyTotals = lastWeekDates.reduce(
    (acc, date) => ({ ...acc, [date]: 0 }),
    {}
  );

  transactions.forEach((transaction) => {
    const dateKey = moment(transaction.date, "DD/MM/YYYY").format("YYYY-MM-DD");
    if (dailyTotals.hasOwnProperty(dateKey)) {
      dailyTotals[dateKey] += parseFloat(transaction.total);
    }
  });

  const labels = lastWeekDates.map((date) => moment(date).format("dd")[0]);
  const data = lastWeekDates.map((date) => dailyTotals[date]);

  return {
    labels,
    datasets: [
      {
        data,
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
      },
    ],
  };
};

//dimension width
const screenWidth = Dimensions.get("window").width;

const expenses = {
  Daily: {
    Home: "$15.75",
    Personal: "$20.50",
    Food: "$25.25",
  },
  Weekly: {
    Home: "$350.75",
    Personal: "$200.50",
    Food: "$150.25",
  },
  Monthly: {
    Home: "$1400.00",
    Personal: "$800.00",
    Food: "$600.00",
  },
};

const TabBar = ({ tabs, onSelect, selectedTab }) => {
  const handlePress = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(tab);
  };

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, selectedTab === tab && styles.selectedTab]}
          onPress={() => handlePress(tab)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === tab && styles.selectedTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

//exceed bubble
const ExceededIndicator = ({ amount }) => {
  return (
    <View style={styles.exceededContainer}>
      <View style={styles.exceededBubble}>
        <Text style={styles.bubbleText}>Exceeded by ${Math.ceil(amount)}</Text>
      </View>
      <View style={styles.exceededArrow} />
    </View>
  );
};

//homescreen
export default function HomeScreen({ navigation }) {
  const quotas = {
    Daily: 70,
    Weekly: 500,
    Monthly: 1500,
  };

  const [selectedTab, setSelectedTab] = useState("Daily");
  // const [currentIndex, setCurrentIndex] = useState(0);
  const [indices, setIndices] = useState({
    Daily: 0,
    Weekly: 0,
    Monthly: 0,
  });
  const [fontsLoaded, setFontsLoaded] = useState(false);
  console.log(selectedTab);
  const [value, setValue] = useState("$0.00");
  const [date, setDate] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const remainingQuota =
    quotas[selectedTab] - parseFloat(value.substring(1).replace(/,/g, ""));
  const progress = (remainingQuota / quotas[selectedTab]) * 100;
  const quotaExceeded = remainingQuota < 0;
  const quotaTextStyle = quotaExceeded
    ? styles.quotaExceeded
    : styles.valueText;
  const [selectedValue, setSelectedValue] = useState("");
  //chart tiles
  const chartTitle = `${selectedTab} Expenses`;
  //getting transactions
  const [transactions, setTransactions] = useState([]);
  const organizedData = organizeTransactions(transactions);
  console.log("Daily Totals:", organizedData.Daily);
  console.log("Weekly Totals:", organizedData.Weekly);
  console.log("Monthly Totals:", organizedData.Monthly);
  console.log("Organized: ", { organizedData });
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        color: () => `blue`,
      },
    ],
  });
  const [expenses, setExpenses] = useState({
    Home: { Daily: 0, Weekly: 0, Monthly: 0 },
    Personal: { Daily: 0, Weekly: 0, Monthly: 0 },
    Food: { Daily: 0, Weekly: 0, Monthly: 0 },
  });

  //get transaction and aggregation
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(
          "http://192.168.50.240:3000/getTransactions"
        );
        if (response.status === 200 && response.data) {
          const organizedData = organizeTransactions(response.data);
          console.log("Daily Totals:", organizedData.Daily);
          console.log("Weekly Totals:", organizedData.Weekly);
          console.log("Monthly Totals:", organizedData.Monthly);
          setTransactions(response.data);
          const barChartData = organizeLastWeekTransactions(response.data);
          setBarChartData(barChartData);
          const categoryTotals = organizeTransactionsByCategory(response.data);
          console.log("Category Totals:", categoryTotals);
          setExpenses(categoryTotals); // Adjust useState to manage expenses state

          if (
            organizedData[selectedTab] &&
            organizedData[selectedTab][indices[selectedTab]]
          ) {
            const { total, date, week, month } =
              organizedData[selectedTab][indices[selectedTab]];
            setValue(`$${total.toFixed(2)}`);

            if (selectedTab === "Daily") {
              setDate(new Date(date));
            } else if (selectedTab === "Weekly") {
              setDate(week);
            } else if (selectedTab === "Monthly") {
              const [monthName, year] = month.split(" ");
              const startOfMonth = moment()
                .month(monthName)
                .year(year)
                .startOf("month")
                .toDate();
              setDate(startOfMonth);
            }
          }
        } else {
          throw new Error("No data received");
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
    };

    fetchTransactions();
  }, [selectedTab, indices[selectedTab]]);

  const formatDate = (date) => {
    if (selectedTab === "Daily") {
      const suffix = [
        "th",
        "st",
        "nd",
        "rd",
        "th",
        "th",
        "th",
        "th",
        "th",
        "th",
      ];
      return (
        <Text>
          {date.toLocaleString("en-us", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      );
    } else if (selectedTab === "Weekly") {
      console.log("Date: ", { date });
      return <Text>{date.toString()}</Text>;
    } else if (selectedTab === "Monthly") {
      return (
        <Text>
          {" "}
          {date.toLocaleString("en-us", {
            month: "long",
            year: "numeric",
          })}{" "}
        </Text>
      );
    }
  };

  const [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: "",
  });

  //tootltip
  const formatTooltipValue = (value) => `$${parseFloat(value).toFixed(2)}`;

  const handleDataPointClick = (data) => {
    const { index, value } = data;
    const formattedValue = formatTooltipValue(value);
    const x =
      (screenWidth / barChartData.labels.length) * index +
      screenWidth / barChartData.labels.length / 2;
    const y = 0;
    setTooltipPos({ x, y, visible: true, value: formattedValue });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "CustomFont-Regular": require("./assets/fonts/LeagueMono-CondensedLight.ttf"),
        "CustomFont-Bold": require("./assets/fonts/LeagueMono-CondensedSemiBold.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "CustomFont-Regular": require("./assets/fonts/LeagueMono-CondensedLight.ttf"),
        "CustomFont-Bold": require("./assets/fonts/LeagueMono-CondensedSemiBold.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  const updateIndex = (newIndex) => {
    setIndices((prevIndices) => ({
      ...prevIndices,
      [selectedTab]: newIndex,
    }));
  };

  const onSwipeLeft = () => {
    if (indices[selectedTab] > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateIndex(indices[selectedTab] - 1);
    }
  };

  const onSwipeRight = () => {
    if (indices[selectedTab] < organizedData[selectedTab].length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateIndex(indices[selectedTab] + 1);
    }
  };

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
  };

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <TabBar
        tabs={["Daily", "Weekly", "Monthly"]}
        selectedTab={selectedTab}
        onSelect={setSelectedTab}
      />
      <GestureRecognizer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        config={config}
        style={styles.valueContainer}
      >
        {/* <TouchableOpacity onPress={onSwipeLeft} style={styles.arrowButton}>
          <MaterialIcons name="arrow-back" size={18} color="grey" />
        </TouchableOpacity> */}
        <View style={styles.valueAndDate}>
          <Animated.Text style={[quotaTextStyle, { opacity: fadeAnim }]}>
            {value}
          </Animated.Text>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </View>
        {/* <TouchableOpacity onPress={onSwipeRight} style={styles.arrowButton}>
          <MaterialIcons name="arrow-forward" size={18} color="grey" />
        </TouchableOpacity> */}
        {quotaExceeded && (
          <ExceededIndicator amount={Math.abs(remainingQuota)} />
        )}
      </GestureRecognizer>

      <View style={styles.squaresSection}>
        <View style={styles.squaresContainer}>
          <View style={styles.square}>
            <MaterialIcons name="home" size={24} color="#0c0212" />
            <Text style={styles.squareText}>
              ${expenses.Home.Weekly.toFixed(2)}
            </Text>
          </View>
          <View style={styles.square}>
            <MaterialIcons name="person" size={24} color="#0c0212" />
            <Text style={styles.squareText}>
              ${expenses.Personal.Weekly.toFixed(2)}
            </Text>
          </View>
          <View style={styles.square}>
            <MaterialIcons name="fastfood" size={24} color="#0c0212" />
            <Text style={styles.squareText}>
              ${expenses.Food.Weekly.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <StatusBar style="auto" />

      <View style={styles.graphSection}>
        <BarChart
          style={styles.barChart}
          data={barChartData}
          width={screenWidth - 72}
          height={270}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            fillShadowGradient: "blue",
            fillShadowGradientOpacity: 1,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            barPercentage: 0.5,
            useShadowColorFromDataset: false,
            barRadius: 10,
            decimalPlaces: 0,
          }}
          fromZero={true}
          yAxisLabel="$"
          showBarTops={false}
          withHorizontalLabels={true}
          segments={4}
          yAxisInterval={1}
          onDataPointClick={handleDataPointClick}
        />
        {tooltipPos.visible && (
          <View
            style={[
              styles.tooltip,
              { top: tooltipPos.y, left: tooltipPos.x - 50 },
            ]}
          >
            {" "}
            // Adjust left position by half tooltip's width for centering
            <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: "#f2f2f2",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 40,
    marginHorizontal: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  selectedTab: {
    backgroundColor: "blue",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    borderWidth: 1,
    borderColor: "black",
  },
  tabText: {
    color: "gray",
    fontFamily: "CustomFont-Regular",
  },
  selectedTabText: {
    color: "white",
  },

  valueContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  valueText: {
    fontSize: 64,
    fontFamily: "CustomFont-Bold",
    color: "#0c0212",
  },
  dateText: {
    fontFamily: "CustomFont-Regular",
    color: "gray",
    fontSize: 14,
  },
  cameraButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0c0212",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 40,
  },
  cameraIcon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  quotaExceeded: {
    fontSize: 64,
    fontFamily: "CustomFont-Bold",
    color: "#DC143C",
  },

  exceededContainer: {
    position: "absolute",
    top: -25,
    left: 180,
    alignSelf: "center",
    alignItems: "center",
  },
  exceededBubble: {
    backgroundColor: "#DC143C",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  exceededArrow: {
    backgroundColor: "#DC143C",
    width: 10,
    height: 10,
    transform: [{ rotate: "45deg" }],
    position: "absolute",
    top: 23,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  bubbleText: {
    color: "white",
    textAlign: "center",
    fontFamily: "CustomFont-Regular",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  graphSection: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    borderWidth: 1,
    borderColor: "black",
  },

  subheader: {
    fontSize: 14,
    color: "#0c0212",
    fontFamily: "CustomFont-Bold",
    marginBottom: 10,
    textAlign: "left",
  },

  squaresSection: {
    marginTop: 60,
    marginBottom: 10,
  },
  squaresContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  square: {
    flex: 1,
    height: 80,
    backgroundColor: "white",
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "black",
  },
  squareText: {
    fontSize: 16,
    color: "gray",
    fontFamily: "CustomFont-Regular",
  },

  chartTitleText: {
    fontSize: 14,
    color: "#0c0212",
    fontFamily: "CustomFont-Bold",
  },
  barChart: {
    marginVertical: 8,
    borderRadius: 16,
    height: 270,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 8,
    borderRadius: 6,
    top: 10,
    transform: [{ translateX: -50 }],
    zIndex: 1,
  },
  tooltipText: {
    color: "white",
    fontFamily: "CustomFont-Regular",
    fontSize: 14,
    textAlign: "center",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    justifyContent: "center",
  },

  valueAndDate: {
    flexDirection: "column",
    alignItems: "center",
  },

  arrowButton: {
    marginHorizontal: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(128, 128, 128, 0.5)",
    borderRadius: 100,
  },
});
