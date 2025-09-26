import i18next from "i18next";
import { initReactI18next } from "preact-i18next";

i18next.use(initReactI18next).init({
  lng: "en", // default language
  fallbackLng: "en",
  ns: ["common", "index"], // namespaces
  defaultNS: "common", // default namespace
  resources: {
    en: {
      index: {
        title: "Sample Page",
        desc: "This is a sample of how the extension will behave within a website"
      },
      common: {
        devicesDetected: "Devices detected",
        enum: "Enumerate",
        capture: "Capture",
        enroll: "Enroll",
        verify: "Verify",
        devices: "Devices",
        test: "Test",
      },
    },
    ptBR: {
      index: {
        title: "Página de Exemplo",
        desc: "Esta é uma amostra de como a extensão se comportará dentro de um site"
      },
      common: {
        devicesDetected: "Dispositivos detectados",
        enum: "Enumeração",
        capture: "Captura",
        enroll: "Registro",
        verify: "Verificação",
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
