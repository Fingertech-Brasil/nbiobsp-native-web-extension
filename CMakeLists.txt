cmake_minimum_required(VERSION 3.10)
project(native_app VERSION 1.0 LANGUAGES CXX)

add_executable(native-app native-app/main.cpp)

set(NITGEN_SDK_PATH "C:/Program Files (x86)/NITGEN/eNBSP SDK Professional/SDK")

# Adds the include directory for header files (-I flag)
target_include_directories(native-app PRIVATE
    "${NITGEN_SDK_PATH}/include"
)

# Links the specific library file
target_link_libraries(native-app PRIVATE
    "${NITGEN_SDK_PATH}/Lib/x64/NBioBSP.lib"
)
