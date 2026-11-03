import sys

import zipfile

for name in zipfile.ZipFile(sys.argv[1]).namelist():
    print(name)
