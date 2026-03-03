#include <iostream>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <io.h>
#include <fcntl.h>
#include <fstream>
#include <nlohmann/json.hpp>
#include <NBioAPI.h>
#include <NBioAPI_Export.h>
#include <algorithm>
#include <vector>
#include <cstdint>
#include <filesystem>

using json = nlohmann::json;
std::ofstream log_file("native_host_log.txt", std::ios_base::app);

json read_message()
{
    std::uint32_t length = 0;
    if (fread(&length, 1, sizeof(length), stdin) != sizeof(length))
    {
        return json::object();
    }

    std::string message(length, '\0');
    if (length > 0 && fread(message.data(), 1, length, stdin) != length)
    {
        return json::object();
    }

    json j = json::parse(message, nullptr, false);
    if (j.is_discarded())
    {
        return json::object();
    }
    log_file << "Received message: " << j << std::endl;

    return j;
}

int write_message(json j)
{
    std::string s = j.dump();
    std::uint32_t len = static_cast<std::uint32_t>(s.length());

    log_file << "Sending response: " << s.c_str() << std::endl;
    log_file << "Response length: " << len << std::endl;

    fwrite(&len, 1, sizeof(len), stdout);
    if (len > 0)
    {
        fwrite(s.data(), 1, len, stdout);
    }
    fflush(stdout);

    return 0;
}

class NBioModule
{
public:
    NBioModule()
    {
        initialize();
    }

    ~NBioModule()
    {
        terminate();
    }

    json enum_devices()
    {
        NBioAPI_RETURN ret;
        NBioAPI_UINT32 nDeviceNum;
        NBioAPI_DEVICE_ID *pDeviceList;

        json res;
        ret = NBioAPI_EnumerateDevice(g_hBSP, &nDeviceNum, &pDeviceList);
        if (ret != NBioAPIERROR_NONE)
        {
            log_file << "Failed to enumerate devices." << std::endl;
            res = {
                {"error", ret},
                {"message", "Failed to enumerate devices."},
                {"data", {
                             {"device-count", 0},
                         }}};
        }
        else
        {
            res = {
                {"error", 0},
                {"message", "Devices enumerated successfully."},
                {"data", {
                             {"device-count", nDeviceNum},
                         }}};
        }

        return res;
    }

    json enroll()
    {
        log_file << "Enroll function called." << std::endl;
        NBioAPI_RETURN ret = NBioAPI_OpenDevice(g_hBSP, NBioAPI_DEVICE_ID_AUTO);

        if (ret != NBioAPIERROR_NONE)
        {
            log_file << "Failed to open device." << std::endl;
            json res = {
                {"error", ret},
                {"message", "Failed to open device."}};
            return res;
        }

        NBioAPI_FIR_HANDLE g_hEnrolledFIR;
        NBioAPI_FIR_HANDLE g_hAuditData;

        json res;

        // NBioaAPI Enroll
        ret = NBioAPI_Enroll(g_hBSP, NULL, &g_hEnrolledFIR, NULL, -1, &g_hAuditData, NULL);
        if (ret == NBioAPIERROR_NONE)
        {
            NBioAPI_FIR_TEXTENCODE g_firText;
            ret = NBioAPI_GetTextFIRFromHandle(g_hBSP, g_hEnrolledFIR, &g_firText, NBioAPI_FALSE);

            if (ret == NBioAPIERROR_NONE)
            {
                std::string template_data = std::string(g_firText.TextFIR);

                // Convert audit FIR handle to INPUT_FIR for image export
                NBioAPI_FIR_TEXTENCODE auditText;
                NBioAPI_EXPORT_AUDIT_DATA exportAuditData;
                NBioAPI_RETURN auditRet = NBioAPI_GetTextFIRFromHandle(g_hBSP, g_hAuditData, &auditText, NBioAPI_FALSE);

                json dataObj = {{"template", template_data}};

                if (auditRet == NBioAPIERROR_NONE)
                {
                    NBioAPI_INPUT_FIR auditInputFir;
                    auditInputFir.Form = NBioAPI_FIR_FORM_TEXTENCODE;
                    auditInputFir.InputFIR.TextFIR = &auditText;

                    NBioAPI_RETURN imgRet = NBioAPI_NBioBSPToImage(g_hBSP, &auditInputFir, &exportAuditData);
                    if (imgRet == NBioAPIERROR_NONE && exportAuditData.AuditData != NULL)
                    {
                        std::for_each(exportAuditData.AuditData,
                                      exportAuditData.AuditData + exportAuditData.FingerNum,
                                      [&](NBioAPI_AUDIT_DATA &auditData)
                                      {
                                          // Convert image data to vector for JSON serialization
                                          size_t dataSize = exportAuditData.ImageWidth * exportAuditData.ImageHeight;
                                          std::vector<unsigned char> imageData(
                                              static_cast<unsigned char *>(auditData.Image->Data),
                                              static_cast<unsigned char *>(auditData.Image->Data) + dataSize);
                                          // Indices 0-4 are right hand from thumb to pinky, 5-9 are left hand also from thumb to pinky
                                          dataObj["audit-data"][auditData.FingerID - 1] = imageData;
                                      });
                        dataObj["audit-width"] = exportAuditData.ImageWidth;
                        dataObj["audit-height"] = exportAuditData.ImageHeight;
                    }

                    NBioAPI_FreeTextFIR(g_hBSP, &auditText);
                    NBioAPI_FreeExportAuditData(g_hBSP, &exportAuditData);
                }

                res = {
                    {"error", 0},
                    {"message", "Capture successful."},
                    {"data", dataObj}};
            }
            else
            {
                log_file << "Enrollment failed." << std::endl;
                res = {
                    {"error", ret},
                    {"message", "Enrollment failed."}};
            }
            NBioAPI_FreeTextFIR(g_hBSP, &g_firText);
            NBioAPI_FreeFIRHandle(g_hBSP, g_hEnrolledFIR);
            if (g_hAuditData != 0)
                NBioAPI_FreeFIRHandle(g_hBSP, g_hAuditData);
        }
        else
        {
            log_file << "Enrollment failed." << std::endl;
            res = {
                {"error", 1},
                {"message", "Enrollment failed."}};
        }

        // Close Device
        NBioAPI_CloseDevice(g_hBSP, NBioAPI_DEVICE_ID_AUTO);

        return res;
    }

    json capture_for_verify()
    {
        log_file << "Capture for verify function called." << std::endl;
        NBioAPI_RETURN ret = NBioAPI_OpenDevice(g_hBSP, NBioAPI_DEVICE_ID_AUTO);

        if (ret != NBioAPIERROR_NONE)
        {
            log_file << "Failed to open device." << std::endl;
            json res = {
                {"error", ret},
                {"message", "Failed to open device."}};
            return res;
        }

        json res;

        // NBioaAPI Capture
        NBioAPI_FIR_HANDLE g_hCapturedFIR;
        NBioAPI_FIR_HANDLE g_hAuditData;
        ret = NBioAPI_Capture(g_hBSP, NBioAPI_FIR_PURPOSE_VERIFY, &g_hCapturedFIR, 10000, &g_hAuditData, NULL);
        if (ret == NBioAPIERROR_NONE)
        {
            NBioAPI_FIR_TEXTENCODE g_firText;
            ret = NBioAPI_GetTextFIRFromHandle(g_hBSP, g_hCapturedFIR, &g_firText, NBioAPI_FALSE);

            if (ret == NBioAPIERROR_NONE)
            {
                std::string template_data = std::string(g_firText.TextFIR);

                // Convert audit FIR handle to INPUT_FIR for image export
                NBioAPI_FIR_TEXTENCODE auditText;
                NBioAPI_EXPORT_AUDIT_DATA exportAuditData;
                NBioAPI_RETURN auditRet = NBioAPI_GetTextFIRFromHandle(g_hBSP, g_hAuditData, &auditText, NBioAPI_FALSE);

                json dataObj = {{"template", template_data}};

                if (auditRet == NBioAPIERROR_NONE)
                {
                    NBioAPI_INPUT_FIR auditInputFir;
                    auditInputFir.Form = NBioAPI_FIR_FORM_TEXTENCODE;
                    auditInputFir.InputFIR.TextFIR = &auditText;

                    NBioAPI_RETURN imgRet = NBioAPI_NBioBSPToImage(g_hBSP, &auditInputFir, &exportAuditData);
                    if (imgRet == NBioAPIERROR_NONE && exportAuditData.AuditData != NULL)
                    {
                        // Convert image data to vector for JSON serialization
                        size_t dataSize = exportAuditData.ImageWidth * exportAuditData.ImageHeight;
                        std::vector<unsigned char> imageData(
                            static_cast<unsigned char *>(exportAuditData.AuditData->Image->Data),
                            static_cast<unsigned char *>(exportAuditData.AuditData->Image->Data) + dataSize);
                        dataObj["audit-data"] = imageData;
                        dataObj["audit-width"] = exportAuditData.ImageWidth;
                        dataObj["audit-height"] = exportAuditData.ImageHeight;
                    }

                    NBioAPI_FreeTextFIR(g_hBSP, &auditText);
                    NBioAPI_FreeExportAuditData(g_hBSP, &exportAuditData);
                }

                res = {
                    {"error", 0},
                    {"message", "Capture successful."},
                    {"data", dataObj}};
            }
            else
            {
                log_file << "Capture failed." << std::endl;
                res = {
                    {"error", ret},
                    {"message", "Capture failed."}};
            }
            NBioAPI_FreeTextFIR(g_hBSP, &g_firText);
            NBioAPI_FreeFIRHandle(g_hBSP, g_hCapturedFIR);
            if (g_hAuditData != 0)
                NBioAPI_FreeFIRHandle(g_hBSP, g_hAuditData);
        }
        else
        {
            log_file << "Capture failed." << std::endl;
            res = {
                {"error", ret},
                {"message", "Capture failed."}};
        }

        // Close Device
        NBioAPI_CloseDevice(g_hBSP, NBioAPI_DEVICE_ID_AUTO);
        return res;
    }

    json verify(const json body)
    {
        json res;
        std::string template_data = body["template"];
        log_file << "Verify function called." << std::endl;
        log_file << "Template data: " << template_data << std::endl;

        NBioAPI_FIR_TEXTENCODE textFir = {NBioAPI_FALSE, template_data.data()};
        NBioAPI_INPUT_FIR inputFir;
        inputFir.Form = NBioAPI_FIR_FORM_TEXTENCODE;
        inputFir.InputFIR.TextFIR = &textFir;
        NBioAPI_BOOL result;

        NBioAPI_RETURN ret = NBioAPI_OpenDevice(g_hBSP, NBioAPI_DEVICE_ID_AUTO);

        if (ret != NBioAPIERROR_NONE)
        {
            log_file << "Failed to open device." << std::endl;
            json res = {
                {"error", ret},
                {"message", "Failed to open device."}};
            return res;
        }

        ret = NBioAPI_Verify(g_hBSP, &inputFir, &result, NULL, 10000, NULL, NULL);
        if (ret == NBioAPIERROR_NONE)
        {
            res = {
                {"error", 0},
                {"message", "Verification successful."},
                {"data", {
                             {"result", result ? "0" : "1"},
                         }}};
        }
        else
        {
            log_file << "Verification failed." << std::endl;
            res = {
                {"error", ret},
                {"message", "Verification failed."}};
        }

        NBioAPI_CloseDevice(g_hBSP, NBioAPI_DEVICE_ID_AUTO);
        return res;
    }

private:
    NBioAPI_HANDLE g_hBSP;

    void initialize()
    {
        if (NBioAPI_Init(&g_hBSP) != NBioAPIERROR_NONE)
        {
            log_file << "Failed to initialize BSP module." << std::endl;
            exit(1);
        }
#if defined(_WIN32) && !defined(_WIN32_WCE)
        std::filesystem::path dllPath;
        {
            wchar_t modulePath[MAX_PATH]{};
            GetModuleFileNameW(nullptr, modulePath, MAX_PATH);
            std::filesystem::path exeDir = std::filesystem::path(modulePath).parent_path();
            dllPath = exeDir / L"NBSP2Por.dll";
        }

        log_file << "Current working dir: " << std::filesystem::current_path().string() << std::endl;
        log_file << "Expected skin DLL path: " << dllPath.string() << std::endl;

        if (!std::filesystem::exists(dllPath))
        {
            log_file << "Skin DLL not found." << std::endl;
        }
        else
        {
            NBioAPI_BOOL bRet = NBioAPI_SetSkinResource(dllPath.string().c_str());
        }
#endif
        log_file << "NBioAPI initialized." << std::endl;
    }

    void terminate()
    {
        // Free FIR Handle.
        if (g_hBSP != (NBioAPI_HANDLE)NULL)
        {
            NBioAPI_DEVICE_ID deviceID = NBioAPI_GetOpenedDeviceID(g_hBSP);

            // Device Close.
            if (NBioAPI_DEVICE_ID_NONE != deviceID)
                NBioAPI_CloseDevice(g_hBSP, deviceID);

            // NBioAPI Terminate
            NBioAPI_Terminate(g_hBSP);
            log_file << "NBioAPI terminated." << std::endl;
        }
    }
};

int main()
{
    log_file << "===================================" << std::endl;
    NBioModule nBioModule;

    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);

    json j = read_message();

    json res;
    if (!j.contains("action") || !j["action"].is_string())
    {
        res = {
            {"error", 1},
            {"message", "Invalid command"}};
        return write_message(res);
    }

    const std::string action = j["action"];
    if (action == "enum")
    {
        res = nBioModule.enum_devices();
    }
    else if (action == "enroll")
    {
        res = nBioModule.enroll();
    }
    else if (action == "capture")
    {
        res = nBioModule.capture_for_verify();
    }
    else if (action == "verify")
    {
        res = nBioModule.verify(j.value("body", json::object()));
    }
    else
    {
        log_file << "Unknown command received: " << action << std::endl;
        res = {
            {"error", 1},
            {"message", "Unknown command"}};
    }

    return write_message(res);
}
