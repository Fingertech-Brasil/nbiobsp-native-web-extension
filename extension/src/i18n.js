import i18next from "i18next";
import { initReactI18next } from "preact-i18next";

i18next.use(initReactI18next).init({
  lng: "en", // default language
  fallbackLng: "en",
  ns: ["common", "popup", "index"], // namespaces
  defaultNS: "common", // default namespace
  resources: {
    en: {
      popup: {
        title: "NBioBSP Web Extension",
        desc: "Click the buttons to test the extension functionalities",
        desc2: "(the extension uses the first detected device by default)",
        captureFail: "Capture failed",
        enrollFail: "Enroll failed",
      },
      index: {
        title: "Sample Page",
        desc: "This is a sample of how the extension will behave within a website"
      },
      background: {
        busy: "Busy with another request",
        noDataReceived: "No data received from native app",
        invalidAction: "Invalid action",
        operationSuccessful: "Background script triggered",
        installPrompt: "Please install the NBioBSP Extension Setup",
      },
      common: {
        checkingDevices: "Checking for devices",
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
      popup: {
        title: "Extensão Web NBioBSP",
        desc: "Clique os botões para testar as funcionalidades da extensão",
        desc2: "(a extensão usa o primeiro dispositivo detectado por padrão)",
        captureFail: "Falha na captura",
        enrollFail: "Falha no registro",
      },
      index: {
        title: "Página de Exemplo",
        desc: "Esta é uma amostra de como a extensão se comportará dentro de um site"
      },
      background: {
        busy: "Ocupado com outra solicitação",
        noDataReceived: "Nenhum dado recebido do aplicativo nativo",
        invalidAction: "Ação inválida",
        operationSuccessful: "Script de fundo acionado",
        installPrompt: "Por favor, instale o Setup Extensão NBioBSP",
      },
      common: {
        checkingDevices: "Verificando dispositivos",
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
