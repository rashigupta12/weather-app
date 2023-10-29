const api_key = "0cfc9b55e3a4962a0532a96b13e8594a";

const days_of_the_week = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const formatTemperature = (temp) => `${temp?.toFixed(1)}\u00B0`;

const createIconUrl = icon => `https://openweathermap.org/img/wn/${icon}@2x.png`;

const getcities = async(searchtext) => {
  const response= await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${searchtext}&limit=5&appid=${api_key}`);
  return response.json();
}

const getCurrentWeatherData = async () => {
  const city = "Delhi";
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api_key}&units=metric`);
  return response.json()
}

const getHourlyForecast = async ({ name: city }) => {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${api_key}&units=metric`);
  const data = await response.json();
  return data.list.map(forecast => {
    const { main: { temp, temp_max, temp_min }, dt, dt_txt, weather: [{ description, icon }] } = forecast;
    return { temp, temp_max, temp_min, dt, dt_txt, description, icon }
  })
}



const loadCurrentForecast = ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) => {
  const currentForecastElement = document.querySelector("#current-forecast");
  currentForecastElement.querySelector(".city").textContent = name;
  currentForecastElement.querySelector(".temperature").textContent = formatTemperature(temp);
  currentForecastElement.querySelector(".description").textContent = description;
  currentForecastElement.querySelector(".min-max-temp").textContent = `H: ${formatTemperature(temp_max)} L:${formatTemperature(temp_min)}`;
}

const loadHourlyForecast = ({ main: { temp: tempNow }, weather: [{ icon: iconNow }] }, hourlyForecast) => {
  console.log(hourlyForecast);
  const timeformatter = Intl.DateTimeFormat("en", {
    hour12: true, hour: "numeric"
  })
  let dataFor12Hours = hourlyForecast.slice(2, 14);
  const hourlycontainer = document.querySelector(".hourly-container");
  let innerHTMLString = `<article>
  <h3 class="time">Now</h3>
  <img class="icon" src="${createIconUrl(iconNow)}" />
  <p class="hourly-temp">${formatTemperature(tempNow)}</p>
</article>`;

  for (let { temp, icon, dt_txt } of dataFor12Hours) {
    innerHTMLString += `<article>
    <h3 class="time">${timeformatter.format(new Date(dt_txt))}</h3>
    <img class="icon" src="${createIconUrl(icon)}" />
    <p class="hourly-temp">${formatTemperature(temp)}</p>
</article>`
  }
  hourlycontainer.innerHTML = innerHTMLString;
}

const calculateDayWiseForecast = (hourlyForecast) => {
  let dayWiseForecast = new Map();
  for (let forecast of hourlyForecast) {
    const [date] = forecast.dt_txt.split(" ");
    const dayoftheweek = days_of_the_week[new Date(date).getDay()]
    console.log(dayoftheweek);
    if (dayWiseForecast.has(dayoftheweek)) {
      let forecastfortheday = dayWiseForecast.get(dayoftheweek);
      forecastfortheday.push(forecast);
      dayWiseForecast.set(dayoftheweek, [forecast]);
    } else {
      dayWiseForecast.set(dayoftheweek, [forecast]);
    }
  }
  for (let [key, value] of dayWiseForecast) {
    let temp_min = Math.min(...Array.from(value, val => val.temp_min))
    let temp_max = Math.max(...Array.from(value, val => val.temp_max))
    dayWiseForecast.set(key, { temp_min, temp_max, icon: value.find(v => v.icon).icon })
  }
  console.log(dayWiseForecast);
  return dayWiseForecast;
}

const loadFiveDayForecast = (hourlyForecast) => {
  console.log(hourlyForecast);
  const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
  const container = document.querySelector(".five-day-forecast-container");
  let daywiseinfo = "";
  Array.from(dayWiseForecast).map(([day, { temp_max, temp_min, icon }], index) => {
    if (index < 5) {
      daywiseinfo += `<article class="day-wise-forecast">
    <h3 class="day">${index === 0 ? "today" : day}</h3>
    <img class="icon"src="${createIconUrl(icon)}" alt="icon for the forecast" />
    <p class="min-temp">${formatTemperature(temp_min)}</p>
    <p class="max-temp">${formatTemperature(temp_max)}</p>
</article>`
    }


  });
  container.innerHTML = daywiseinfo



}
const loadFeelsLike = ({ main: { feels_like } }) => {
  let container = document.querySelector("#feels-like");
  container.querySelector(".feels-like-temp").textContent = formatTemperature(feels_like);
}


const loadHumidity = ({ main: { humidity } }) => {
  let container = document.querySelector("#humidity");
  container.querySelector(".feels-like-humidity").textContent = `${humidity}%`;

}

function debounce(func){
  let timer;
  return(...args) =>
  {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this,args)
    }, 500);
  }
}

const onsearchchange = async(event) =>{
  let { v alue} = event.target;
  const listofcities = await getCitiesUsingGeoloacation(value);
  let options = "";
  for(let {lat ,lon, name, state, country} of listofcities){
    options+=`<option data-city-details='${JSON.stringify({lat,lon,name})}'value = "${name},${state},${country}"></option>`
    document.querySelector("#cities").innerHTML=options;
  }
}

const debouncesearch = debounce((event) => onsearchchange(event))

document.addEventListener("DOMContentLoaded", async () => {
  const searchinput = document.querySelector("#search");
  searchinput.addEventListener("input",onsearchchange);
  const currentWeather = await getCurrentWeatherData();
  loadCurrentForecast(currentWeather);
  const hourlyForecast = await getHourlyForecast(currentWeather);
  loadHourlyForecast(currentWeather, hourlyForecast);
  loadFiveDayForecast(hourlyForecast)
  loadFeelsLike(currentWeather);
  loadHumidity(currentWeather)

})