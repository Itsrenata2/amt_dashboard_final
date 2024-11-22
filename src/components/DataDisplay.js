import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DataDisplay = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedStartMonth, setSelectedStartMonth] = useState("");
  const [selectedEndMonth, setSelectedEndMonth] = useState("");
  const [selectedResiduo, setSelectedResiduo] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableTiposResiduo, setAvailableTiposResiduo] = useState([]);
  const availableMonths = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/dados");
        setData(response.data);
        setError(null);

        const years = [...new Set(response.data.map((row) => row.ano))];
        setAvailableYears(years);

        const tiposResiduo = [
          ...new Set(response.data.map((row) => row.tipo_residuo)),
        ];
        setAvailableTiposResiduo(tiposResiduo);
      } catch (error) {
        setError("Error fetching data");
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedResiduo.length > 0) {
        selectedResiduo.forEach((residuo) =>
          params.append("tipo_residuo", residuo)
        );
      }
      if (selectedStartMonth) params.append("mes_inicio", selectedStartMonth);
      if (selectedEndMonth) params.append("mes_fim", selectedEndMonth);

      const response = await axios.get(
        `http://127.0.0.1:5000/dados?${params.toString()}`
      );
      setData(response.data);
    } catch (error) {
      setError("Error applying filters");
      console.error("Error applying filters:", error);
    }
  };

  const processDataForChart = (data) => {
    const months = availableMonths.slice(
      selectedStartMonth ? availableMonths.indexOf(selectedStartMonth) : 0,
      selectedEndMonth
        ? availableMonths.indexOf(selectedEndMonth) + 1
        : availableMonths.length
    );

    const labels = [
      ...new Set(data.map((row) => row.tipo_residuo || "Desconhecido")),
    ];
    const totals = {};

    months.forEach((month) => {
      totals[month] = {};
      labels.forEach((label) => {
        totals[month][label] = 0;
      });
    });

    data.forEach((row) => {
      const tipoResiduo = row.tipo_residuo || "Desconhecido";
      months.forEach((month) => {
        const value = row[month];
        if (value) {
          const numericValue = parseFloat(value) || 0;
          totals[month][tipoResiduo] += numericValue;
        }
      });
    });

    const colors = [
      "rgba(255, 99, 132, 0.5)",
      "rgba(54, 162, 235, 0.5)",
      "rgba(255, 206, 86, 0.5)",
      "rgba(75, 192, 192, 0.5)",
      "rgba(153, 102, 255, 0.5)",
      "rgba(255, 159, 64, 0.5)",
    ];

    const datasets = months.map((month, index) => ({
      label: month,
      data: labels.map((tipoResiduo) => totals[month][tipoResiduo]),
      backgroundColor: colors[index % colors.length],
    }));

    return {
      labels,
      datasets,
    };
  };

  const chartData = processDataForChart(data);

  const handleResiduoChange = (event) => {
    const { options } = event.target;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedResiduo(selected);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Coleta de Resíduos</h2>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="yearSelect">Selecione o ano:</label>
        <select
          id="yearSelect"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Todos os anos</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <label htmlFor="residuoSelect" style={{ marginLeft: "20px" }}>
          Tipo de Resíduo:
        </label>
        <select
          id="residuoSelect"
          multiple
          value={selectedResiduo}
          onChange={handleResiduoChange}
          style={{ marginLeft: "10px", height: "100px" }}
        >
          {availableTiposResiduo.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>

        <label htmlFor="startMonthSelect" style={{ marginLeft: "20px" }}>
          Mês de início:
        </label>
        <select
          id="startMonthSelect"
          value={selectedStartMonth}
          onChange={(e) => setSelectedStartMonth(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Todos os meses</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <label htmlFor="endMonthSelect" style={{ marginLeft: "20px" }}>
          Mês de fim:
        </label>
        <select
          id="endMonthSelect"
          value={selectedEndMonth}
          onChange={(e) => setSelectedEndMonth(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Todos os meses</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <button onClick={handleFilterChange} style={{ marginLeft: "20px" }}>
          Aplicar Filtros
        </button>
      </div>

      {error ? (
        <div style={{ color: "red" }}>Error: {error}</div>
      ) : chartData ? (
        <div style={{ width: "100%", height: "600px", margin: "0 auto" }}>
          <Bar data={chartData} options={{ responsive: true }} />
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default DataDisplay;
