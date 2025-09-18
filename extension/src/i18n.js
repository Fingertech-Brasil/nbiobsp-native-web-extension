import i18next from "i18next";
import { initReactI18next } from "preact-i18next";

i18next.use(initReactI18next).init({
  lng: "ptBR", // default language
  fallbackLng: "en",
  ns: ["common", "popup", "index"], // namespaces
  defaultNS: "common", // default namespace
  resources: {
    en: {
      popup: {
        title: "NBioBSP Web Extension",
        desc: "Click the buttons to test the extension functionalities",
        desc2: "(the extension uses the first detected device by default)",
        checkingDevices: "Checking for devices",
        devicesDetected: "Devices detected",
      },
      index: {
        title: "Sample Page",
        desc: "This is a sample of how the extension will behave within a website"
      },
      common: {
        capture: "Capture",
        enroll: "Enroll",
        enum: "Enumerate",
        devices: "Devices",
        test: "Test",
      },
    },
    ptBR: {
      popup: {
        title: "Extensão Web NBioBSP",
        desc: "Clique os botões para testar as funcionalidades da extensão",
        desc2: "(a extensão usa o primeiro dispositivo detectado por padrão)",
        checkingDevices: "Verificando dispositivos",
        devicesDetected: "Dispositivos detectados",
      },
      index: {
        title: "Página de Exemplo",
        desc: "Esta é uma amostra de como a extensão se comportará dentro de um site"
      },
      common: {
        capture: "Captura",
        enroll: "Registro",
        enum: "Enumeração",
        devices: "Dispositivos",
        test: "Testar",
      },
    },
  },
  interpolation: {
    escapeValue: false, // Preact already protects from XSS
  },
});

export default i18next;
