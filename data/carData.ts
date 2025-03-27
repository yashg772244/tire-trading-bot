export interface CarMake {
  name: string;
  models: CarModel[];
}

export interface CarModel {
  name: string;
  years: number[];
  tireSizes: string[];
}

export interface TireSize {
  width: string;
  profile: string;
  rim: string;
}

export const carMakes: CarMake[] = [
  {
    name: "BMW",
    models: [
      {
        name: "3 Series",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["225/45R17", "225/40R18", "225/35R19"]
      },
      {
        name: "5 Series",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["245/45R18", "245/40R19", "275/35R20"]
      },
      {
        name: "X5",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["255/50R19", "275/40R20", "315/35R21"]
      }
    ]
  },
  {
    name: "Audi",
    models: [
      {
        name: "A4",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["225/50R17", "245/40R18", "245/35R19"]
      },
      {
        name: "A6",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["245/45R18", "255/40R19", "265/35R20"]
      },
      {
        name: "Q5",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["235/60R18", "255/45R20", "265/40R21"]
      }
    ]
  },
  {
    name: "Mercedes",
    models: [
      {
        name: "C-Class",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["225/45R17", "225/40R18", "245/35R19"]
      },
      {
        name: "E-Class",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["245/45R18", "255/40R19", "275/35R20"]
      },
      {
        name: "GLC",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
        tireSizes: ["235/60R18", "255/45R20", "265/40R21"]
      }
    ]
  }
];

export const tireWidths = ["185", "195", "205", "215", "225", "235", "245", "255", "265", "275", "285", "295", "305", "315", "325", "335", "345", "355"];

export const tireProfiles = ["25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80"];

export const rimSizes = ["14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"];

export const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i); 