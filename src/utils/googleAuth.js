import { google } from "googleapis";

class GoogleAuth {
  constructor() {
    this.client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
  }

  async generateAuthUrl() {
    const url = this.client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });
    return url;
  }

  async getUserInfo(code) {
    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);
    console.log({ tokens });

    const oauth2 = google.oauth2({
      auth: this.client,
      version: "v2",
    });

    // Fetch basic user profile and email information
    const userInfo = await oauth2.userinfo.get();
    const user = userInfo.data;
    console.log({ userInfo, user });

    // Get high-resolution profile picture
    const highResPicture = user.picture.replace(/=s96-c$/, "");

    return {
      ...user,
      picture: highResPicture,
    };
  }
}

export default GoogleAuth;
