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

# Copy the native app manifest to the build folder during the build process
add_custom_command(
    TARGET native-app POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/native-app/nativehost-chrome.json"
            "${CMAKE_BINARY_DIR}/nativehost-chrome.json"
    COMMENT "Copying nativehost-chrome.json to the build folder"
)

# ================================================
# CPack configuration for the installer generation
# ================================================

install(TARGETS native-app DESTINATION .)
install(FILES "${CMAKE_SOURCE_DIR}/native-app/nativehost-chrome.json" DESTINATION .)

# Set project information
set(CPACK_PACKAGE_NAME "NBioBSP Extension")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "Native messaging host for Simple Biometric Extension")
# needs to be in the form X.Y.Z.W for Windows installers
set(CPACK_PACKAGE_VERSION "1.0.0.0")
set(CPACK_PACKAGE_INSTALL_DIRECTORY "${CPACK_PACKAGE_NAME}")
set(CPACK_PACKAGE_FILE_NAME "${CPACK_PACKAGE_NAME} Setup")
set(CPACK_PACKAGE_VENDOR "${CPACK_PACKAGE_NAME}")

if(CMAKE_SYSTEM_NAME STREQUAL "Windows")
    # Specify the generator (NSIS for Windows installers)
    set(CPACK_GENERATOR "NSIS")

    # NSIS-specific settings
    set(CPACK_NSIS_BRANDING_TEXT "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")
    set(CPACK_NSIS_DISPLAY_NAME "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")
    set(CPACK_NSIS_PACKAGE_NAME "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")
    set(CPACK_NSIS_WELCOME_TITLE "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")

    # Paths to resources
    set(CPACK_NSIS_MUI_ICON "${CMAKE_SOURCE_DIR}/native-app/resources/icon.ico")
    set(CPACK_NSIS_MUI_UNIICON "${CMAKE_SOURCE_DIR}/native-app/resources/icon.ico")
    set(CPACK_NSIS_INSTALLED_ICON_NAME "${CMAKE_SOURCE_DIR}/native-app/resources/icon.ico")
    set(CPACK_NSIS_MUI_HEADERIMAGE "${CMAKE_SOURCE_DIR}/native-app/resources/header.bmp")
    set(CPACK_NSIS_MUI_WELCOMEFINISHPAGE_BITMAP "${CMAKE_CURRENT_LIST_DIR}/native-app/resources/banner.bmp")
    set(CPACK_NSIS_MUI_UNWELCOMEFINISHPAGE_BITMAP "${CMAKE_CURRENT_LIST_DIR}/native-app/resources/banner.bmp")
    set(CPACK_NSIS_MANIFEST_DPI_AWARE true)

    # Pages options
    set(CPACK_NSIS_ENABLE_UNINSTALL_BEFORE_INSTALL ON) # Ask about uninstalling previous versions before installation
    set(CPACK_NSIS_MODIFY_PATH OFF) # PATH modification not in original script
    
    set(CPACK_RESOURCE_FILE_LICENSE ${CMAKE_CURRENT_LIST_DIR}/LICENSE)

    # Add registry entries for Add/Remove Programs
    set(CPACK_NSIS_EXTRA_INSTALL_COMMANDS "
        WriteRegStr HKCU 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                    'DisplayName' '${CPACK_PACKAGE_NAME} ${CPACK_PACKAGE_VERSION}'
        WriteRegStr HKCU 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                    'UninstallString' '$\\\"$INSTDIR\\\\Uninstall.exe$\\\"'
        WriteRegDWORD HKCU 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                    'NoModify' 1
        WriteRegDWORD HKCU 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}' \
                    'NoRepair' 1
        WriteRegStr HKCU 'Software\\\\Google\\\\Chrome\\\\NativeMessagingHosts\\\\com.nbiobsp_native_web_ext' '' \
                    '$INSTDIR\\\\nativehost-chrome.json'
    ")

    # Remove registry entries and files during uninstall
    set(CPACK_NSIS_EXTRA_UNINSTALL_COMMANDS "
        DeleteRegKey HKCU 'Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\${CPACK_PACKAGE_NAME}'
        DeleteRegKey HKCU 'Software\\\\Google\\\\Chrome\\\\NativeMessagingHosts\\\\com.nbiobsp_native_web_ext'
        Delete '$INSTDIR\\\\native-app.exe'
        Delete '$INSTDIR\\\\nativehost-chrome.json'
        Delete '$INSTDIR\\\\native_host_log.txt'
        Delete '$INSTDIR\\\\uninstall.exe'
    ")

    # Set installation directory to $LOCALAPPDATA
    set(CPACK_NSIS_INSTALL_ROOT "$LOCALAPPDATA/")

    list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/native-app/resources")
    
endif()

# Include CPack
include(CPack)
