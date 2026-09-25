#!/bin/bash
# GFT Linux Installer
# WORK IN PROGRESS!!!!! TRUST AT YOUR OWN RISK
# Debian 13/Testing

set -euo pipefail

## config
GIT_NAME=""
GIT_MAIL=""
TIMEZONE="$(timedatectl show --va -p Timezone 2>/dev/null || true)"

SELECTED=""

## utils
die() {
  echo "ERROR: $*" >&2
  exit 1
}

msgbox() {
  whiptail --title "$1" --msgbox "$2" 12 70
}

yesno() {
  whiptail --title "$1" --yesno "$2" 12 70
}

inputbox() {
  whiptail --title "$1" --inputbox "$2" \
    12 70 "$3" \
    3>&1 1>&2 2>&3
}

is_selected() {
  [[ "$SELECTED" == *"\"$1\""* ]]
}



preflight() {
  if [[ $EUID -eq 0 ]]; then
    die "please do not run this script as root"
  fi

  if ! command -v sudo >/dev/null 2>&1; then
    die "sudo is missing"
  fi
  if ! command -v whiptail >/dev/null 2>&1; then
    die "whiptail is missing"
  fi
}


## basic config
ask_basic() {
  GIT_NAME="$(inputbox "git config" "enter your git name:" "$GIT_NAME")"
  GIT_MAIL="$(inputbox "git config" "enter your git email:" "$GIT_MAIL")"
  TIMEZONE="$(inputbox "system"     "enter your timezone:" "$TIMEZONE")"
}

ask_category() {
  SELECTED="$(whiptail \
    --title "categories" \
    --checklist "check the components you'd like to install." \
    20 75 10 \
    "media" "Media editing software"        ON \
    "docker" "Containerization"             ON \
    "3d" "3D Software"                      OFF \
    3>&1 1>&2 2>&3
  )" || exit 0
}


## installers
install_base() {
  sudo apt update
  sudo apt install -y \
    ca-certificates curl wget gnupg unzip zip \
    p7zip-full rsync git git-lfs nano tmux htop btop \
    tree jq \
    build-essential cmake ninja-build make pkg-config gdb \
    python3 python3-pip python3-venv \
    \
    kde-plasma-desktop \
    firefox-esr vlc libreoffice dolphin ark gwenview kde-spectacle kate konsole \
    flatpak plasma-discover plasma-discover-backend-flatpak
  
  
  # configure flatpak
  sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

  # configure git
  git config --global user.name "$GIT_NAME"
  git config --global user.email "$GIT_MAIL"

  # configure timezone
  sudo timedatectl set-timezone "$TIMEZONE"

  # configure kde
  # TODO
}

install_media() {
  sudo apt install -y krita kdenlive obs-studio
  #flatpak install -y flathub org.kde.krita org.kde.kdenlive com.obsproject.Studio
}

install_docker() {
  # TODO
  return
}

install_3d() {
  flatpak install -y flathub org.blender.Blender
}


## summary
show_summary() {
  whiptail --title "summary" --msgbox "
username: $(whoami)
git name: $GIT_NAME
git email: $GIT_MAIL
timezone: $TIMEZONE

categories: $SELECTED
  " 22 75
}


main() {
  preflight

  ask_basic
  ask_category
  show_summary
  if ! yesno "confirm install" "the components will now be installed. this will modify your system. continue?"; then
    echo "cancelled, no changes were made."
    exit 0
  fi

  install_base
  is_selected "media" && install_media
  is_selected "docker" && install_docker
  is_selected "3d" && install_3d


  msgbox "setup complete" "ready! system will now reboot."
  sudo reboot
}

main "$@"