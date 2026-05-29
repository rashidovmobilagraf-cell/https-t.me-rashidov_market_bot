# Minimal stub for the missing imghdr module required by python-telegram-bot on newer Python versions.
# This provides the 'what' function used by the library.

def what(file, h=None):
    """Return None as we do not perform image header detection.
    The telegram library only uses this to validate image files; returning None
    disables the check but does not affect core bot functionality.
    """
    return None
