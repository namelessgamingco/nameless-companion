const { execSync } = require("child_process")
const path = require("path")

exports.default = async function (context) {
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  )
  const frameworksPath = path.join(appPath, "Contents", "Frameworks")
  
  console.log("Stripping resource forks from:", appPath)
  
  try {
    // Strip xattr from the entire app bundle
    execSync(`xattr -cr "${appPath}"`, { stdio: "inherit" })
    console.log("Successfully stripped resource forks")
  } catch (error) {
    console.error("xattr strip failed, trying individual paths...")
    try {
      // Target Frameworks specifically
      execSync(`find "${frameworksPath}" -type f -exec xattr -c {} +`, {
        stdio: "inherit",
      })
      execSync(`find "${appPath}/Contents/MacOS" -type f -exec xattr -c {} +`, {
        stdio: "inherit",
      })
      console.log("Successfully stripped resource forks (individual)")
    } catch (err) {
      console.error("Individual strip also failed:", err.message)
    }
  }
}