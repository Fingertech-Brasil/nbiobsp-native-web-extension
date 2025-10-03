cmake_minimum_required(VERSION 3.31)
project(native-app LANGUAGES CXX)

set(VERSION_MAJOR 1)
set(VERSION_MINOR 0)
set(VERSION_PATCH 0)
set(COMPANY_NAME "Fingertech")
set(FILE_DESCRIPTION "Native messaging host for Simple Biometric Extension")
set(APP_NAME "NBioBSP Extension")
set(PRODUCT_NAME "${APP_NAME}")
set(CPACK_RESOURCE_FILE_LICENSE "${CMAKE_SOURCE_DIR}/LICENSE.txt")
set(CPACK_RESOURCE_FILE_LICENSE_PTBR "${CMAKE_SOURCE_DIR}/LICENSE_ptBR.txt")

include(FetchContent)

FetchContent_Declare(json URL https://github.com/nlohmann/json/releases/download/v3.12.0/json.tar.xz)
FetchContent_MakeAvailable(json)

set(SOURCES ${CMAKE_SOURCE_DIR}/native-app/main.cpp)

if(CMAKE_SYSTEM_NAME STREQUAL "Windows")
    set(NITGEN_SDK_PATH "C:/Program Files (x86)/NITGEN/eNBSP SDK Professional/SDK")
    file(TO_CMAKE_PATH "${NITGEN_SDK_PATH}/include" NITGEN_SDK_INCLUDE)
    file(TO_CMAKE_PATH "${NITGEN_SDK_PATH}/Lib/x64/NBioBSP.lib" NBIOBSP_LIB)

    set(RC_TEMPLATE ${CMAKE_SOURCE_DIR}/native-app/resources/win-res.rc.in)
    set(RC_OUTPUT ${CMAKE_BINARY_DIR}/native-app/resources/win-res.rc)
    
    configure_file(
        ${RC_TEMPLATE}
        ${RC_OUTPUT}
    )
    
    configure_file(
        ${CMAKE_SOURCE_DIR}/native-app/resources/icon.ico
        ${CMAKE_BINARY_DIR}/native-app/resources/icon.ico
        COPYONLY
    )
    
    set(RC_OBJ ${CMAKE_BINARY_DIR}/win-res.rc.obj)
    
    add_custom_command(
        OUTPUT ${RC_OBJ}
        COMMAND ${CMAKE_RC_COMPILER} -O coff
                -i ${RC_OUTPUT}
                -o ${RC_OBJ}
        DEPENDS ${RC_OUTPUT}
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/native-app/resources
        COMMENT "Compiling resource file win-res.rc (excluding NITGEN SDK paths)"
    )
    
    # Append the compiled resource object (not the raw .rc) to SOURCES
    list(APPEND SOURCES ${RC_OBJ})
endif()

add_executable(native-app ${SOURCES})

# Adds the include directory for header files (-I flag)
target_include_directories(native-app PRIVATE
    "${NITGEN_SDK_INCLUDE}"
)

target_link_options(native-app PRIVATE -static-libstdc++ -static-libgcc)

# Links the specific library file
target_link_libraries(native-app PRIVATE
    "${NBIOBSP_LIB}"
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
install(FILES "${CMAKE_SOURCE_DIR}/native-app/resources/NBSP2Por.dll" DESTINATION .)

# Set project information
set(CPACK_PACKAGE_NAME "${APP_NAME}")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "${FILE_DESCRIPTION}")
# needs to be in the form X.Y.Z.W for Windows installers
set(CPACK_PACKAGE_VERSION "${VERSION_MAJOR}.${VERSION_MINOR}.${VERSION_PATCH}.0")
set(CPACK_PACKAGE_INSTALL_DIRECTORY "${CPACK_PACKAGE_NAME}")
set(CPACK_PACKAGE_FILE_NAME "${CPACK_PACKAGE_NAME} Setup")
set(CPACK_PACKAGE_VENDOR "${COMPANY_NAME}")

if(CMAKE_SYSTEM_NAME STREQUAL "Windows")
    set(NITGEN_SDK_BIN "${NITGEN_SDK_PATH}/Bin/x64")
    find_file(NBIOBSP_DLL
        NAMES "NBioBSP.dll"
        PATHS "${NITGEN_SDK_BIN}"
        NO_DEFAULT_PATH)
    if (NBIOBSP_DLL)
        install(FILES "${NBIOBSP_DLL}" DESTINATION .)
    endif()

    # Specify the generator (NSIS for Windows installers)
    set(CPACK_GENERATOR "NSIS")

    # NSIS-specific settings
    set(CPACK_NSIS_BRANDING_TEXT "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")
    set(CPACK_NSIS_DISPLAY_NAME "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")
    set(CPACK_NSIS_PACKAGE_NAME "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")
    set(CPACK_NSIS_WELCOME_TITLE "${CPACK_PACKAGE_NAME} v${CPACK_PACKAGE_VERSION}")
    set(CPACK_NSIS_INSTALLED_ICON_NAME "native-app.exe")

    # Paths to resources
    set(CPACK_NSIS_MUI_ICON "${CMAKE_SOURCE_DIR}/native-app/resources/icon.ico")
    set(CPACK_NSIS_MUI_UNIICON "${CMAKE_SOURCE_DIR}/native-app/resources/icon.ico")
    set(CPACK_NSIS_MUI_HEADERIMAGE "${CMAKE_SOURCE_DIR}/native-app/resources/header.bmp")
    set(CPACK_NSIS_MUI_WELCOMEFINISHPAGE_BITMAP "${CMAKE_SOURCE_DIR}/native-app/resources/banner.bmp")
    set(CPACK_NSIS_MUI_UNWELCOMEFINISHPAGE_BITMAP "${CMAKE_SOURCE_DIR}/native-app/resources/banner.bmp")
    set(CPACK_NSIS_MANIFEST_DPI_AWARE true)

    # Pages options
    set(CPACK_NSIS_ENABLE_UNINSTALL_BEFORE_INSTALL ON) # Ask about uninstalling previous versions before installation
    set(CPACK_NSIS_MODIFY_PATH OFF) # PATH modification not in original script
    
    # Add registry entries for Add/Remove Programs
    set(CPACK_NSIS_EXTRA_INSTALL_COMMANDS "
        WriteRegStr HKCU 'Software\\\\Google\\\\Chrome\\\\NativeMessagingHosts\\\\com.nbiobsp_native_web_ext' '' \
                    '$INSTDIR\\\\nativehost-chrome.json'
    ")

    # Remove registry entries and files during uninstall
    set(CPACK_NSIS_EXTRA_UNINSTALL_COMMANDS "
        DeleteRegKey HKCU 'Software\\\\Google\\\\Chrome\\\\NativeMessagingHosts\\\\com.nbiobsp_native_web_ext'
        Delete '$INSTDIR\\\\native-app.exe'
        Delete '$INSTDIR\\\\nativehost-chrome.json'
        Delete '$INSTDIR\\\\NBioBSP.dll'
        Delete '$INSTDIR\\\\NBSP2Por.dll'
        Delete '$INSTDIR\\\\native_host_log.txt'
        Delete '$INSTDIR\\\\uninstall.exe'
    ")

    # Set installation directory to $LOCALAPPDATA
    set(CPACK_NSIS_INSTALL_ROOT "$LOCALAPPDATA/")

    list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/native-app/resources")
    
endif()

# Include CPack
include(CPack)
