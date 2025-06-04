# Get the Windows host IP (most common need)
ip route show | grep -i default | awk '{ print $3}'

# Alternative method
# cat /etc/resolv.conf | grep nameserver | awk '{print $2}'