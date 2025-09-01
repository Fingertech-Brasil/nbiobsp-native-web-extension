#include <iostream>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <io.h>
#include <fcntl.h>
#include <fstream>
#include "imports/json.hpp"
#include <NBioAPI.h>

using json = nlohmann::json;
std::ofstream log_file("native_host_log.txt", std::ios_base::app);

json read_message(){
    unsigned int length = 0;

    // read the first four bytes
    for (int i = 0; i < 4; i++)
    {
        unsigned int read_char = getchar();
        length = length | (read_char << i*8);
    }

    // read the message from the extension
    std::string message = "";
    for (int i = 0; i < length; i++)
    {
        message += getchar();
    }
    json j = json::parse(message);
    log_file << "Received message: " << j << std::endl;

    return j;
} 

int write_message(json j){
    std::string s = j.dump();
    unsigned int len = s.length();

    // send back the 4 bytes with the length of the message
    printf("%c%c%c%c",  (char) (len & 0xff),
                        (char) (len << 8 & 0xff),
                        (char) (len << 16 & 0xff),
                        (char) (len << 24 & 0xff));
    
    // output the message
    printf("%s", s.c_str());

    return 0;
}

class NBioModule{
    private:
        NBioAPI_HANDLE g_hBSP;
    public:
        NBioModule() {
            initialize();
        }

        ~NBioModule(){
            terminate();
        }

        void initialize(){
            if ( NBioAPI_Init(&g_hBSP) != NBioAPIERROR_NONE )
            { 
                log_file << "Failed to initialize BSP module." << std::endl;                
                exit(1);
            }
            log_file << "NBioAPI initialized." << std::endl;
        }

        json enum_devices(){
            NBioAPI_RETURN ret;
            NBioAPI_UINT32 nDeviceNum;
            NBioAPI_DEVICE_ID *pDeviceList;

            json res;
            ret = NBioAPI_EnumerateDevice(g_hBSP, &nDeviceNum, &pDeviceList);
            if (ret != NBioAPIERROR_NONE) {
                log_file << "Failed to enumerate devices." << std::endl;
                res = {
                    {"error", 1},
                    {"message", "Failed to enumerate devices."},
                    {"data", {
                        {"device-count", 0},
                    }}
                };
            }
            else {
                res = {
                    {"error", 0},
                    {"message", "Devices enumerated successfully."},
                    {"data", {
                        {"device-count", nDeviceNum},
                    }}
                };
            }

            return res;
        }

        json enroll(){
            log_file << "Enroll function called." << std::endl;
            json res = {
                {"error", 0},
                {"message", "Enrollment completed"},
                {"data", {
                    {"fingers-registered", 1},
                    {"template", "template_data"}
                }}
            };
            return res;
        }

        json capture_for_verify(){
            log_file << "Capture and verify function called." << std::endl;
            json res = {
                {"error", 0},
                {"message", "Capture completed"},
                {"data", {
                    {"template", "template_data"}
                }}
            };
            return res;
        }

        void terminate()
        {
            //Free FIR Handle.
            if (g_hBSP != (NBioAPI_HANDLE)NULL) {
                NBioAPI_DEVICE_ID deviceID = NBioAPI_GetOpenedDeviceID(g_hBSP);

                //Device Close.
                if (NBioAPI_DEVICE_ID_NONE != deviceID)
                    NBioAPI_CloseDevice(g_hBSP, deviceID);

                //NBioAPI Terminate
                NBioAPI_Terminate(g_hBSP);
                log_file << "NBioAPI terminated." << std::endl;
            }
        }
};

int main()
{
    NBioModule nBioModule;

    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);

    json j = read_message();

    // actions hashmap
    std::unordered_map<std::string, std::function<json()>> actions = {
        {"enum", [&]() { return nBioModule.enum_devices(); }},
        {"enroll", [&]() { return nBioModule.enroll(); }},
        {"capture", [&]() { return nBioModule.capture_for_verify(); }}
    };

    std::string action = j["action"];
    json res;
    // lookup and execute action
    if (actions.find(action) != actions.end()) {
        res = actions[action]();
    } else {
        log_file << "Unknown command received: " << action << std::endl;
        res = {
            {"error", 1},
            {"message", "Unknown command"}
        };
    }
    
    log_file << "Sending response: " << res << std::endl;
    return write_message(res);
}
