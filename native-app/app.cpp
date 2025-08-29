#include <iostream>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <io.h>
#include <fcntl.h>
#include <fstream>
#include "imports/json.hpp"

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

int main()
{
    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);

    json j = read_message();

    // actions hashmap
    std::unordered_map<std::string, std::function<json()>> actions = {
        {"enroll", enroll},
        {"capture", capture_for_verify}
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