cmake_minimum_required(VERSION 3.31)
project(native-app VERSION 1.0 LANGUAGES CXX)

include(FetchContent)

FetchContent_Declare(json URL https://github.com/nlohmann/json/releases/download/v3.12.0/json.tar.xz)
FetchContent_MakeAvailable(json)

add_executable(native-app native-app/main.cpp)

set(NITGEN_SDK_PATH "C:/Program Files (x86)/NITGEN/eNBSP SDK Professional/SDK")

# Adds the include directory for header files (-I flag)
target_include_directories(native-app PRIVATE
    "${NITGEN_SDK_PATH}/include"
)

# Links the specific library file
target_link_libraries(native-app PRIVATE
    "${NITGEN_SDK_PATH}/Lib/x64/NBioBSP.lib"
    nlohmann_json::nlohmann_json
)

# ========================================
# CPack configuration for the installer generation
# ========================================

install(TARGETS native-app DESTINATION .)
install(FILES "${CMAKE_SOURCE_DIR}/native-app/nativehost-chrome.json" DESTINATION .)

# Set project information
set(CPACK_PACKAGE_NAME "NBioBSP Extension")
set(CPACK_PACKAGE_VENDOR "YoruAlptraum")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "Native messaging host for Simple Biometric Extension")
set(CPACK_PACKAGE_VERSION "0.1")
set(CPACK_PACKAGE_INSTALL_DIRECTORY "NBioBSP Extension")
set(CPACK_PACKAGE_FILE_NAME "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")

# Specify the generator (NSIS for Windows installers)
set(CPACK_GENERATOR "NSIS")

# NSIS-specific settings
set(CPACK_NSIS_DISPLAY_NAME "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION} Installer")
set(CPACK_NSIS_PACKAGE_NAME "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION} Installer")
set(CPACK_NSIS_MUI_ICON "${CMAKE_SOURCE_DIR}/native-app/icon.ico")
set(CPACK_NSIS_MUI_UNIICON "${CMAKE_SOURCE_DIR}/native-app/icon.ico")
set(CPACK_NSIS_MODIFY_PATH OFF) # PATH modification not in original script
set(CPACK_NSIS_ENABLE_UNINSTALL_BEFORE_INSTALL ON)

# Add registry entries for Add/Remove Programs
set(CPACK_NSIS_EXTRA_INSTALL_COMMANDS "
    WriteRegStr HKLM 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                 'DisplayName' '${CPACK_PACKAGE_NAME} ${CPACK_PACKAGE_VERSION}'
    WriteRegStr HKLM 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                 'UninstallString' '$\\\"$INSTDIR\\\\Uninstall.exe$\\\"'
    WriteRegDWORD HKLM 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                  'NoModify' 1
    WriteRegDWORD HKLM 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                  'NoRepair' 1
    WriteRegStr HKCU 'Software\\\\Google\\\\Chrome\\\\NativeMessagingHosts\\\\com.nbiobsp_native_web_ext' '' \
                 '$INSTDIR\\\\nativehost-chrome.json'
")

# Remove registry entries and files during uninstall
set(CPACK_NSIS_EXTRA_UNINSTALL_COMMANDS "
    DeleteRegKey HKLM 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}'
    DeleteRegKey HKCU 'Software\\\\Google\\\\Chrome\\\\NativeMessagingHosts\\\\com.nbiobsp_native_web_ext'
    Delete '$INSTDIR\\\\native-app.exe'
    Delete '$INSTDIR\\\\nativehost-chrome.json'
    Delete '$INSTDIR\\\\native_host_log.txt'
")

# Set installation directory to $LOCALAPPDATA
set(CPACK_NSIS_INSTALL_ROOT "$LOCALAPPDATA")

# Include CPack
include(CPack)
