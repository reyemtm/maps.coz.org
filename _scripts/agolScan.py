from urllib.request import Request, urlopen
from urllib.parse import urlencode, quote
from queue import Queue
import datetime, argparse, os, sys, json, getpass
from threading import Thread

# Global variables
deleteCnt = 0
addupdCnt = 0
addonlyCnt = 0
updonlyCnt = 0
updattribCnt = 0
errorCnt = 0
publicFSItems = []
referer = 'AGOLScan'

# Defines the entry point into the script
def main(argv):
    currentDir = os.getcwd()
    parser = argparse.ArgumentParser(description='ArcGIS Online Security Scanner')
    parser.add_argument('-n', '--orgname', help='Organization domain name (ex. sample.maps.arcgis.com)')
    parser.add_argument('-o', '--outputdir', help='Output directory')
    parser.add_argument('-u', '--username', help='Username from organization - ArcGIS account only')
    parser.add_argument('-p', '--password', help='Password')
    parser.add_argument('-?', action='help')
    args=parser.parse_args()

    # Prompt for ArcGIS.com fqdn if not added as an argument
    if args.orgname:
        orgName = args.orgname
    else:
        orgName = input('Enter ArcGIS.com domain name (ex sample.maps.arcgis.com): ').strip()

    # Prompt for output directory if not included as an argument
    if args.outputdir:
        outputDir = args.outputdir
    else:
        outputDir = input('Enter output directory [' + currentDir + ']: ').strip()
        if outputDir == '':
            outputDir = currentDir

    orgid = getOrgid(orgName, args.username, args.password)
    scanItems(orgName, orgid)
    scanReportHTML(orgName, outputDir)

def getOrgid(orgName, username, password):
    # Get OrgID through portals/self call if public access is enabled
    selfUrl = 'https://' + orgName + '/sharing/rest/portals/self?f=json'
    try:
        request = Request(selfUrl)
        selfInfo = json.loads(urlopen(request).read().decode('utf-8'))
        if 'id' in selfInfo.keys():
            orgId = selfInfo['id']
        else:
            if not username:
                username = input('Enter username: ').strip()
            if not password:
                password = getpass.getpass('Enter password: ')
            token = generateToken('https://' + orgName + '/sharing/rest/generateToken', username, password)
            request = Request(selfUrl)
            request.add_header('Authorization', 'Bearer ' + token)
            request.add_header('Referer', referer)
            selfInfo = json.loads(urlopen(request).read().decode('utf-8'))
            if 'id' in selfInfo.keys():
                orgId = selfInfo['id']
            else:
                raise Exception('Error retrieving organization id from {}'.format(orgName))
    except Exception as e:
        raise Exception(e)
    return orgId

# Function to scan all items for each user
def scanItems(orgName, orgid):
    num_threads = 10
    queue = Queue()
    startTime = datetime.datetime.now()
    startNum = 1
    itemCnt = 0

    # Setup threads to query feature services
    for i in range(num_threads):
        worker = Thread(target=checkService, args=(i, queue,))
        worker.setDaemon(True)
        worker.start()

    while startNum > 0:
        getItemsUrl = 'https://' + orgName + '/sharing/rest/search'
        params = {'f': 'json', 'num': '100', 'q': 'type: "Feature Service" AND access: "public" AND orgid: ' + orgid,
                  'sortField':'owner', 'start': str(startNum)}
        request = Request(getItemsUrl, urlencode(params).encode())
        userItems = json.loads(urlopen(request).read().decode('utf-8'))
        if 'total' in userItems.keys() and userItems['total'] > 0:
            for item in userItems['results']:
                if item['url'] != '' and 'FeatureServer' in item['url']:
                    try:
                        queue.put(item)
                    except:
                        print('Invalid request - ' + item['url'])
                    itemCnt += 1
        startNum = userItems['nextStart']
    queue.join()
    print('Total open items scanned: {}'.format(itemCnt))
    print('Total open items with add, update, delete allowed: {}'.format(deleteCnt))
    print('Total open items with add and update allowed: {}'.format(addupdCnt))
    print('Total open items with add only allowed: {}'.format(addonlyCnt))
    print('Total open items with update only allowed: {}'.format(updonlyCnt))
    print('Total open items with update attributes only allowed: {}'.format(updattribCnt))
    print('Total errors: {}'.format(errorCnt))
    print('Total time: {} sec'.format((datetime.datetime.now() - startTime).seconds))
    print(orgid)
    return

def checkService(i, q):
    global deleteCnt
    global addupdCnt
    global addonlyCnt
    global updonlyCnt
    global updattribCnt
    global errorCnt
    while True:
        data = q.get()
        try:
            serviceUrl = quote(data['url'].encode('utf-8'), safe="%/:=&?~#+!$,;'@()*[]")
        except:
            serviceUrl = ''
            print('Error generating url')
        try:
            request = Request(serviceUrl + '?f=json')
            request.add_header('User-Agent', 'Mozilla/5.0')
            itemDetails = json.loads(urlopen(request).read().decode('utf-8'))
            if 'capabilities' in itemDetails.keys() and 'Delete' in itemDetails['capabilities']:
                publicFSItems.append({'type':'delete', 'name': data['title'], 'url': serviceUrl})
                deleteCnt += 1
            elif 'capabilities' in itemDetails.keys() and 'Update' in itemDetails['capabilities'] and 'Create' in itemDetails['capabilities']:
                publicFSItems.append({'type':'addupd', 'name': data['title'], 'url': serviceUrl})
                addupdCnt += 1
            elif 'capabilities' in itemDetails.keys() and 'Create' in itemDetails['capabilities']:
                publicFSItems.append({'type':'addonly', 'name': data['title'], 'url': serviceUrl})
                addonlyCnt +=1
            elif 'capabilities' in itemDetails.keys() and 'Update' in itemDetails['capabilities']:
                if 'allowGeometryUpdates' in itemDetails.keys() and itemDetails['allowGeometryUpdates'] == True:
                    publicFSItems.append({'type': 'updonly', 'name': data['title'], 'url': serviceUrl})
                    updonlyCnt += 1
                else:
                    publicFSItems.append({'type':'updattrib', 'name': data['title'], 'url': serviceUrl})
                    updattribCnt += 1
        except:
            publicFSItems.append({'type': 'error', 'name': data['title'], 'url': serviceUrl})
            errorCnt += 1
        q.task_done()

# Output scan results to HTML format
def scanReportHTML(orgName,outputDir):
    scanResults = sorted(publicFSItems, key=lambda x:(x['type'],x['name'].lower()))
    outputFile = os.path.join(outputDir, 'OnlineScanReport_' + orgName.split('.')[0] + '_' + str(datetime.datetime.now().date()) + '.html')
    try:
        with open(outputFile, 'w') as htmlOut:
            htmlOut.write('<html><body>\n')
            htmlOut.write('<h1>ArcGIS Online Public Feature Service Scan Report - ' + datetime.date.today().strftime('%x') + '</h1>\n')
            htmlOut.write('<h2>Organization: ' + orgName + '</h2>\n')
            if len(scanResults) == 0:
                htmlOut.write('<h3>No public feature services with edit capabilities were discovered that need to be reviewed.</h3>\n')
                htmlOut.write('</body></html>')
            else:
                if deleteCnt > 0:
                    htmlOut.write('<h3>Public feature services with capabilities to add, update, and delete features ({})</h3>\n'.format(deleteCnt))
                    for item in scanResults:
                        if item['type'] == 'delete':
                            htmlOut.write('&nbsp;&nbsp;&nbsp;&nbsp;<b>' + item['name'] + ' -</b> ' + item['url'] + '<br>\n')
                if addupdCnt > 0:
                    htmlOut.write('<h3>Public feature services with capabilities to add and update features ({})</h3>\n'.format(addupdCnt))
                    for item in scanResults:
                        if item['type'] == 'addupd':
                            htmlOut.write('&nbsp;&nbsp;&nbsp;&nbsp;<b>' + item['name'] + ' -</b> ' + item['url'] + '<br>\n')
                if addonlyCnt > 0:
                    htmlOut.write('<h3>Public feature services with capabilities to only add new features ({})</h3>\n'.format(addonlyCnt))
                    for item in scanResults:
                        if item['type'] == 'addonly':
                            htmlOut.write('&nbsp;&nbsp;&nbsp;&nbsp;<b>' + item['name'] + ' -</b> ' + item['url'] + '<br>\n')
                if updonlyCnt > 0:
                    htmlOut.write('<h3>Public feature services with capabilities to only update features ({})</h3>\n'.format(updonlyCnt))
                    for item in scanResults:
                        if item['type'] == 'updonly':
                            htmlOut.write('&nbsp;&nbsp;&nbsp;&nbsp;<b>' + item['name'] + ' -</b> ' + item['url'] + '<br>\n')
                if updattribCnt > 0:
                    htmlOut.write('<h3>Public feature services with capabilities to only update feature attributes ({})</h3>\n'.format(updattribCnt))
                    for item in scanResults:
                        if item['type'] == 'updattrib':
                            htmlOut.write('&nbsp;&nbsp;&nbsp;&nbsp;<b>' + item['name'] + ' -</b> ' + item['url'] + '<br>\n')
                if errorCnt > 0:
                    htmlOut.write('<h3>Error accessing the following feature service urls ({})</h3>\n'.format(errorCnt))
                    for item in scanResults:
                        if item['type'] == 'error':
                            htmlOut.write('&nbsp;&nbsp;&nbsp;&nbsp;<b>' + item['name'] + ' -</b> ' + item['url'] + '<br>\n')
                htmlOut.write('</table></body></html>')
            htmlOut.close()
    except:
        print('Unable to write to {}'.format(outputDir))
        print('Update permissions or specify an alternate output directory')
        raise Exception
    print('\nArgis Online Public Feature Service scan completed - {} feature services noted'.format(len(publicFSItems)))
    print('Scan results written to {}'.format(outputFile))

# Function to generate token
def generateToken(tokenUrl, username, password):
    params = {'username': username,
              'password': password,
              'client': 'referer',
              'referer': referer,
              'expiration': '10',
              'f': 'json'}
    try:
        request = Request(tokenUrl, urlencode(params).encode())
        response = json.loads(urlopen(request).read().decode('utf-8'))
        if 'token' in response.keys():
            return response['token']
        else:
            raise Exception('{}'.format(response))
    except Exception as e:
        raise Exception('Unable to generate token\n{}'.format(e))

# Script start
if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except Exception as mainE:
        print('Error scanning ArcGIS Online feature services')
        print('{}'.format(mainE))
        sys.exit(1)